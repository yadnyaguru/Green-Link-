package com.greenlink.service;

import com.greenlink.dto.ListingView;
import com.greenlink.dto.RequestView;
import com.greenlink.dto.UserView;
import com.greenlink.model.Listing;
import com.greenlink.model.Request;
import com.greenlink.repository.RequestRepository;
import com.greenlink.util.IdUtil;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class RequestService {

    private final RequestRepository repo;
    private final ListingService listings;
    private final UserService users;

    public RequestService(RequestRepository r, ListingService l, UserService u) {
        repo = r;
        listings = l;
        users = u;
    }

    public RequestView create(ObjectId uid, String listingId, String message, int quantity) {
        if (listingId == null || listingId.isBlank())
            throw new IllegalArgumentException("Listing ID is required");
        if (quantity < 1)
            throw new IllegalArgumentException("Quantity must be at least 1");

        Listing l = listings.require(Objects.requireNonNull(IdUtil.oid(listingId)));
        if (l.getProvider() != null && l.getProvider().equals(uid))
            throw new IllegalArgumentException("You cannot request your own listing");

        if (l.getQuantity() > 0 && quantity > l.getQuantity()) {
            throw new IllegalArgumentException("Requested quantity (" + quantity + ") exceeds available stock (" + l.getQuantity() + ")");
        }

        // Prevent duplicate pending requests for the same listing
        boolean alreadyPending = repo.findByRequesterOrderByCreatedAtDesc(uid).stream()
                .anyMatch(req -> req.getListing() != null && req.getListing().equals(l.getId()) && "pending".equals(req.getStatus()));
        if (alreadyPending)
            throw new IllegalArgumentException("You already have a pending request for this listing");

        Request r = new Request();
        r.setListing(l.getId());
        r.setRequester(uid);
        r.setProvider(l.getProvider());
        r.setMessage(message == null ? "" : message.trim());
        r.setQuantity(quantity);
        r.setTotalPrice(l.getPrice() * quantity);
        repo.save(r);
        return view(r);
    }

    public List<RequestView> mine(ObjectId id) {
        return repo.findByRequesterOrderByCreatedAtDesc(id).stream().map(this::view).toList();
    }

    public List<RequestView> incoming(ObjectId id) {
        return repo.findByProviderOrderByCreatedAtDesc(id).stream().map(this::view).toList();
    }

    /**
     * Status transition rules:
     *  - accepted / rejected : only the provider can set these (from pending)
     *  - completed           : either provider or requester can mark this (from accepted)
     */
    public RequestView status(ObjectId uid, ObjectId id, String newStatus) {
        if (!Set.of("accepted", "rejected", "completed").contains(newStatus))
            throw new IllegalArgumentException("Invalid status. Allowed: accepted, rejected, completed");

        Request r = repo.findById(Objects.requireNonNull(id)).orElseThrow(() -> new NoSuchElementException("Request not found"));

        // Validate ownership
        boolean isProvider  = r.getProvider() != null && r.getProvider().equals(uid);
        boolean isRequester = r.getRequester() != null && r.getRequester().equals(uid);
        if (!isProvider && !isRequester)
            throw new AccessDeniedException("You are not a participant in this request");

        // Transition guards
        switch (newStatus) {
            case "accepted", "rejected" -> {
                if (!isProvider)
                    throw new AccessDeniedException("Only the provider can accept or reject a request");
                if (!"pending".equals(r.getStatus()))
                    throw new IllegalArgumentException("Can only accept/reject pending requests");
            }
            case "completed" -> {
                if (!"accepted".equals(r.getStatus()))
                    throw new IllegalArgumentException("Can only complete accepted requests");
            }
        }

        // When provider accepts request, decrement available listing stock
        if ("accepted".equals(newStatus) && r.getListing() != null) {
            try {
                Listing l = listings.require(r.getListing());
                int currentQty = l.getQuantity();
                int reqQty = r.getQuantity() > 0 ? r.getQuantity() : 1;
                int remaining = Math.max(0, currentQty - reqQty);
                l.setQuantity(remaining);
                if (remaining == 0) {
                    l.setAvailability(false);
                }
                listings.save(l);
            } catch (Exception ignored) {}
        }

        r.setStatus(newStatus);
        repo.save(r);
        return view(r);
    }

    public Request require(ObjectId id) {
        return repo.findById(Objects.requireNonNull(id)).orElseThrow(() -> new NoSuchElementException("Request not found"));
    }

    public boolean participant(Request r, ObjectId uid) {
        return (r.getRequester() != null && r.getRequester().equals(uid))
                || (r.getProvider() != null && r.getProvider().equals(uid));
    }

    public RequestView view(Request r) {
        Object listingView = null;
        if (r.getListing() != null) {
            try {
                listingView = listings.view(listings.require(r.getListing()));
            } catch (Exception e) {
                listingView = null;
            }
        }
        UserView requester = null;
        if (r.getRequester() != null) {
            try { requester = users.publicView(r.getRequester()); } catch (Exception ignored) {}
        }
        UserView provider = null;
        if (r.getProvider() != null) {
            try { provider = users.publicView(r.getProvider()); } catch (Exception ignored) {}
        }
        double total = r.getTotalPrice();
        if (total <= 0 && listingView instanceof ListingView lv) {
            total = lv.price() * (r.getQuantity() > 0 ? r.getQuantity() : 1);
        }
        return new RequestView(
                r.getId().toHexString(),
                listingView,
                requester,
                provider,
                r.getStatus(),
                r.getMessage(),
                r.getQuantity() > 0 ? r.getQuantity() : 1,
                total,
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
