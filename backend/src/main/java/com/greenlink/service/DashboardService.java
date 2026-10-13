package com.greenlink.service;

import com.greenlink.dto.DashboardStats;
import com.greenlink.dto.ProviderStats;
import com.greenlink.repository.ListingRepository;
import com.greenlink.repository.PlantRepository;
import com.greenlink.repository.RatingRepository;
import com.greenlink.repository.RequestRepository;
import com.greenlink.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.DateOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final UserRepository users;
    private final PlantRepository plants;
    private final ListingRepository listings;
    private final RequestRepository requests;
    private final RatingRepository ratings;
    private final MongoTemplate mongo;

    public DashboardService(UserRepository u, PlantRepository p, ListingRepository l,
                            RequestRepository r, RatingRepository ra, MongoTemplate m) {
        users = u;
        plants = p;
        listings = l;
        requests = r;
        ratings = ra;
        mongo = m;
    }

    public DashboardStats stats() {
        var rs = ratings.findAll();
        double avg = rs.stream().mapToInt(r -> r.getRating()).average().orElse(0);
        double roundedAvg = Math.round(avg * 10.0) / 10.0;

        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        Aggregation daily = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("createdAt").gte(Objects.requireNonNull(since))),
                Aggregation.project("createdAt")
                        .and(DateOperators.DateToString.dateOf("createdAt").toString("%Y-%m-%d")).as("day"),
                Aggregation.group("day").count().as("count"),
                Aggregation.sort(Sort.Direction.ASC, "_id")
        );

        List<Map<String, Object>> activity = new ArrayList<>();
        try {
            for (Document d : mongo.aggregate(daily, "requests", Document.class).getMappedResults()) {
                String dayId = d.get("_id") != null ? String.valueOf(d.get("_id")) : "";
                Number countNum = d.get("count", Number.class);
                int count = countNum != null ? countNum.intValue() : 0;
                Map<String, Object> item = new HashMap<>();
                item.put("_id", dayId);
                item.put("count", count);
                activity.add(item);
            }
        } catch (Exception ignored) {
            // Activity aggregation will gracefully remain empty if an issue occurs
        }

        return new DashboardStats(
                plants.count(),
                listings.count(),
                requests.count(),
                users.countByIsProviderTrue(),
                users.count(),
                roundedAvg,
                rs.size(),
                activity
        );
    }

    public ProviderStats provider(ObjectId oid) {
        var rs = ratings.findByProviderOrderByCreatedAtDesc(oid);
        double avg = rs.stream().mapToInt(r -> r.getRating()).average().orElse(0);
        double roundedAvg = Math.round(avg * 10.0) / 10.0;
        return new ProviderStats(
                listings.countByProvider(oid),
                requests.countByProvider(oid),
                roundedAvg,
                rs.size()
        );
    }
}
