package com.greenlink.service;

import com.greenlink.dto.RatingView;
import com.greenlink.dto.UserView;
import com.greenlink.model.Rating;
import com.greenlink.model.Request;
import com.greenlink.repository.RatingRepository;
import com.greenlink.util.IdUtil;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class RatingService {

    private final RatingRepository repo;
    private final RequestService requests;
    private final UserService users;

    public RatingService(RatingRepository r, RequestService q, UserService u) {
        repo = r;
        requests = q;
        users = u;
    }

    public RatingView create(ObjectId uid, String requestId, int rating, String comment) {
        if (requestId == null || requestId.isBlank())
            throw new IllegalArgumentException("Request ID is required");
        Request r = requests.require(IdUtil.oid(requestId));
        if (!"completed".equals(r.getStatus()))
            throw new IllegalArgumentException("Can only rate completed requests");
        if (r.getRequester() == null || !r.getRequester().equals(uid))
            throw new AccessDeniedException("Only the requester can rate");
        if (rating < 1 || rating > 5)
            throw new IllegalArgumentException("Rating must be between 1 and 5");

        Rating x = new Rating();
        x.setProvider(r.getProvider());
        x.setUser(uid);
        x.setRequest(r.getId());
        x.setRating(rating);
        x.setComment(comment == null ? "" : comment.trim());
        try {
            repo.save(x);
        } catch (DuplicateKeyException e) {
            throw new IllegalArgumentException("Already rated this request");
        }
        return view(x);
    }

    public Map<String, Object> provider(ObjectId id) {
        List<Rating> rs = repo.findByProviderOrderByCreatedAtDesc(id);
        double avg = rs.stream().mapToInt(r -> r.getRating()).average().orElse(0);
        double roundedAvg = Math.round(avg * 10.0) / 10.0;
        Map<String, Object> result = new HashMap<>();
        result.put("ratings", rs.stream().map(this::view).toList());
        result.put("averageRating", roundedAvg);
        result.put("count", rs.size());
        return result;
    }

    private RatingView view(Rating r) {
        UserView provider = null;
        if (r.getProvider() != null) {
            try {
                provider = users.publicView(r.getProvider());
            } catch (Exception ignored) {}
        }
        UserView user = null;
        if (r.getUser() != null) {
            try {
                user = users.publicView(r.getUser());
            } catch (Exception ignored) {}
        }
        String reqId = r.getRequest() != null ? r.getRequest().toHexString() : "";
        return new RatingView(
                r.getId().toHexString(),
                provider,
                user,
                reqId,
                r.getRating(),
                r.getComment(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
