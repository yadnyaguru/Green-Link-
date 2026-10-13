package com.greenlink.service;

import com.greenlink.dto.ListingView;
import com.greenlink.dto.PlantView;
import com.greenlink.dto.UserView;
import com.greenlink.model.GeoLocation;
import com.greenlink.model.Listing;
import com.greenlink.model.User;
import com.greenlink.repository.ListingRepository;
import com.greenlink.util.IdUtil;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class ListingService {

    private final ListingRepository repo;
    private final PlantService plants;
    private final UserService users;
    private final MongoTemplate mongo;

    public ListingService(ListingRepository r, PlantService p, UserService u, MongoTemplate m) {
        repo = r;
        plants = p;
        users = u;
        mongo = m;
    }

    public List<ListingView> all() {
        return repo.findByAvailabilityTrueOrderByCreatedAtDesc().stream().map(this::view).toList();
    }

    public List<ListingView> mine(ObjectId uid) {
        return repo.findByProviderOrderByCreatedAtDesc(uid).stream().map(this::view).toList();
    }

    /**
     * @param radius distance in metres (default 50 km)
     */
    public List<ListingView> nearby(double lat, double lng, double radius) {
        Query q = new Query(Criteria.where("availability").is(true)
                .and("location").nearSphere(new GeoJsonPoint(lng, lat)).maxDistance(radius));
        return mongo.find(q, Listing.class).stream().map(this::view).toList();
    }

    public ListingView create(ObjectId uid, String plantId, double price, int quantity, String address, String desc, double lat, double lng) {
        User user = users.require(uid);
        if (!user.isProvider()) {
            // Automatically promote user to provider so listing creation is seamless
            users.update(uid, null, true);
        }
        if (plantId == null || plantId.isBlank())
            throw new IllegalArgumentException("plant is required");
        if (price < 0)
            throw new IllegalArgumentException("Price must be non-negative");
        if (quantity < 1)
            throw new IllegalArgumentException("Available quantity must be at least 1");
        // Verify the plant exists
        ObjectId plantOid = Objects.requireNonNull(IdUtil.oid(plantId));
        plants.one(plantOid);

        Listing l = new Listing();
        l.setProvider(uid);
        l.setPlant(plantOid);
        l.setPrice(price);
        l.setQuantity(quantity);
        l.setAddress(address == null ? "" : address.trim());
        l.setDescription(desc == null ? "" : desc.trim());
        l.setLocation(new GeoLocation(lng, lat));
        repo.save(l);
        return view(l);
    }

    public ListingView update(ObjectId uid, ObjectId id, Map<String, Object> body) {
        Listing l = repo.findById(Objects.requireNonNull(id)).orElseThrow(() -> new NoSuchElementException("Listing not found"));
        if (l.getProvider() == null || !l.getProvider().equals(uid))
            throw new AccessDeniedException("Not authorized");
        if (body != null) {
            if (body.containsKey("price") && body.get("price") != null) {
                try {
                    double price = Double.parseDouble(body.get("price").toString());
                    if (price < 0) throw new IllegalArgumentException("Price must be non-negative");
                    l.setPrice(price);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid price value");
                }
            }
            if (body.containsKey("quantity") && body.get("quantity") != null) {
                try {
                    int quantity = Integer.parseInt(body.get("quantity").toString());
                    if (quantity < 0) throw new IllegalArgumentException("Quantity cannot be negative");
                    l.setQuantity(quantity);
                    if (quantity == 0) l.setAvailability(false);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid quantity value");
                }
            }
            if (body.containsKey("address")) {
                Object addr = body.get("address");
                l.setAddress(addr != null ? addr.toString().trim() : "");
            }
            if (body.containsKey("description")) {
                Object desc = body.get("description");
                l.setDescription(desc != null ? desc.toString() : "");
            }
            if (body.containsKey("availability") && body.get("availability") != null) {
                l.setAvailability(Boolean.parseBoolean(body.get("availability").toString()));
            }
        }
        repo.save(l);
        return view(l);
    }

    public void delete(ObjectId uid, ObjectId id) {
        Listing l = repo.findById(Objects.requireNonNull(id)).orElseThrow(() -> new NoSuchElementException("Listing not found"));
        if (l.getProvider() == null || !l.getProvider().equals(uid))
            throw new AccessDeniedException("Not authorized");
        repo.delete(Objects.requireNonNull(l));
    }

    public Listing require(ObjectId id) {
        return repo.findById(Objects.requireNonNull(id)).orElseThrow(() -> new NoSuchElementException("Listing not found"));
    }

    public Listing save(Listing l) {
        return repo.save(l);
    }

    public ListingView view(Listing l) {
        UserView pv = null;
        if (l.getProvider() != null) {
            try { pv = users.publicView(l.getProvider()); } catch (Exception ignored) {}
        }
        PlantView pl = null;
        if (l.getPlant() != null) {
            try { pl = plants.one(l.getPlant()); } catch (Exception ignored) {}
        }
        // location may be null for legacy/incomplete records
        Object location = l.getLocation();
        return new ListingView(l.getId().toHexString(), pv, pl, l.getPrice(),
                l.getQuantity() > 0 ? l.getQuantity() : 1,
                l.getAddress() != null ? l.getAddress() : "",
                l.getDescription(), l.isAvailability(), location,
                l.getCreatedAt(), l.getUpdatedAt());
    }
}
