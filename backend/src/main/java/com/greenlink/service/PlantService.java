package com.greenlink.service;

import com.greenlink.dto.PlantView;
import com.greenlink.dto.UserView;
import com.greenlink.model.Plant;
import com.greenlink.repository.PlantRepository;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PlantService {

    private final PlantRepository repo;
    private final UserService users;
    private final MediaService media;

    public PlantService(PlantRepository repo, UserService users, MediaService media) {
        this.repo  = repo;
        this.users = users;
        this.media = media;
    }

    // ── Read ────────────────────────────────────────────────────────────────────

    public List<PlantView> all(String search) {
        List<Plant> plants = (search == null || search.isBlank())
                ? repo.findAllByOrderByCreatedAtDesc()
                : repo.search(search);
        return plants.stream().map(this::view).toList();
    }

    public PlantView one(ObjectId id) {
        return view(repo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Plant not found")));
    }

    // ── Create ──────────────────────────────────────────────────────────────────

    public PlantView create(ObjectId uid, String name, String sci, String desc,
                            String care, MultipartFile image) {
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Plant name is required");

        Plant p = new Plant();
        p.setName(name.trim());
        p.setScientificName(safe(sci));
        p.setDescription(safe(desc));
        p.setCareInstructions(safe(care));
        p.setAddedBy(uid);
        saveImage(p, image);
        repo.save(p);
        return view(p);
    }

    // ── Update ──────────────────────────────────────────────────────────────────

    public PlantView update(ObjectId uid, ObjectId id, String name, String sci,
                            String desc, String care, MultipartFile image) {
        Plant p = repo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Plant not found"));

        if (p.getAddedBy() == null || !p.getAddedBy().equals(uid))
            throw new AccessDeniedException("Not authorized to edit this plant");

        if (name != null && !name.isBlank()) p.setName(name.trim());
        if (sci  != null)  p.setScientificName(sci);
        if (desc != null)  p.setDescription(desc);
        if (care != null)  p.setCareInstructions(care);

        if (image != null && !image.isEmpty()) {
            String oldUrl = p.getImage();
            String oldPid = p.getImagePublicId();
            saveImage(p, image);
            media.delete(oldUrl, oldPid);
        }

        repo.save(p);
        return view(p);
    }

    // ── Delete ──────────────────────────────────────────────────────────────────

    public void delete(ObjectId uid, ObjectId id) {
        Plant p = repo.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Plant not found"));

        if (p.getAddedBy() == null || !p.getAddedBy().equals(uid))
            throw new AccessDeniedException("Not authorized to delete this plant");

        media.delete(p.getImage(), p.getImagePublicId());
        repo.delete(Objects.requireNonNull(p));
    }

    // ── Internal helpers ────────────────────────────────────────────────────────

    /** Upload image to Cloudinary/local storage and update the plant fields. */
    private void saveImage(Plant p, MultipartFile file) {
        if (file == null || file.isEmpty()) return;
        try {
            var result = media.upload(file, "plants");
            p.setImage(result.url());
            p.setImagePublicId(result.publicId());
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Image upload failed: " + e.getMessage(), e);
        }
    }

    /** Null-safe trim — returns empty string for null input. */
    private String safe(String s) {
        return s == null ? "" : s.trim();
    }

    /** Build a PlantView DTO from a Plant entity.
     *  If the addedBy user cannot be resolved (deleted account, null ref),
     *  addedBy is returned as null rather than crashing. */
    public PlantView view(Plant p) {
        UserView addedBy = null;
        if (p.getAddedBy() != null) {
            try {
                addedBy = users.publicView(p.getAddedBy());
            } catch (Exception ignored) {
                // User was deleted or not found — return null for addedBy
            }
        }
        return new PlantView(
                p.getId().toHexString(),
                p.getName(),
                p.getScientificName(),
                p.getDescription(),
                p.getCareInstructions(),
                p.getImage(),
                addedBy,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
