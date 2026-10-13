package com.greenlink.controller;

import com.greenlink.dto.ListingView;
import com.greenlink.security.AppUserPrincipal;
import com.greenlink.service.ListingService;
import java.util.List;
import java.util.Map;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService s;

    public ListingController(ListingService s) {
        this.s = s;
    }

    @GetMapping
    public List<ListingView> all() {
        return s.all();
    }

    @GetMapping("/nearby")
    public List<ListingView> nearby(@RequestParam double lat,
                                   @RequestParam double lng,
                                   @RequestParam(defaultValue = "50000") double radius) {
        return s.nearby(lat, lng, radius);
    }

    @GetMapping("/mine")
    public List<ListingView> mine(@AuthenticationPrincipal AppUserPrincipal p) {
        return s.mine(new ObjectId(p.getId()));
    }

    @PostMapping
    public ResponseEntity<ListingView> create(@AuthenticationPrincipal AppUserPrincipal p,
                                             @RequestBody Map<String, Object> b) {
        int qty = 1;
        if (b.containsKey("quantity") && b.get("quantity") != null) {
            try {
                qty = Integer.parseInt(b.get("quantity").toString().trim());
            } catch (Exception ignored) {}
        }

        double price = 0.0;
        if (b.containsKey("price") && b.get("price") != null) {
            try {
                price = Double.parseDouble(b.get("price").toString().trim());
            } catch (Exception ignored) {}
        }

        double lat = 18.5204;
        if (b.containsKey("lat") && b.get("lat") != null && !b.get("lat").toString().isBlank()) {
            try {
                lat = Double.parseDouble(b.get("lat").toString().trim());
            } catch (Exception ignored) {}
        }

        double lng = 73.8567;
        if (b.containsKey("lng") && b.get("lng") != null && !b.get("lng").toString().isBlank()) {
            try {
                lng = Double.parseDouble(b.get("lng").toString().trim());
            } catch (Exception ignored) {}
        }

        String address = b.containsKey("address") && b.get("address") != null ? b.get("address").toString().trim() : "";
        String desc = b.containsKey("description") && b.get("description") != null ? b.get("description").toString().trim() : "";
        String plant = b.containsKey("plant") && b.get("plant") != null ? b.get("plant").toString().trim() : "";

        return ResponseEntity.status(201).body(s.create(
                new ObjectId(p.getId()),
                plant,
                price,
                qty,
                address,
                desc,
                lat,
                lng
        ));
    }

    @PutMapping("/{id}")
    public ListingView update(@AuthenticationPrincipal AppUserPrincipal p,
                              @PathVariable String id,
                              @RequestBody Map<String, Object> b) {
        return s.update(new ObjectId(p.getId()), new ObjectId(id), b);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal AppUserPrincipal p,
                                      @PathVariable String id) {
        s.delete(new ObjectId(p.getId()), new ObjectId(id));
        return Map.of("message", "Listing deleted");
    }
}
