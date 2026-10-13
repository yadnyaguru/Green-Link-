package com.greenlink.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.greenlink.config.CloudinaryConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaService {

    private final Cloudinary cloudinary;
    private final CloudinaryConfig config;
    private final Path uploadRoot;

    public MediaService(Cloudinary c, CloudinaryConfig cfg,
                        @Value("${app.upload-dir:uploads}") String dir) {
        cloudinary = c;
        config = cfg;
        // Always resolve to absolute so paths are consistent regardless of CWD
        uploadRoot = Paths.get(dir).toAbsolutePath().normalize();
    }

    public UploadResult upload(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("No image file provided");
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/"))
            throw new IllegalArgumentException("Only image files are allowed");

        if (config.enabled()) {
            try {
                Map<?, ?> r = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap("folder", "greenlink/" + folder, "resource_type", "image"));
                return new UploadResult((String) r.get("secure_url"), (String) r.get("public_id"));
            } catch (Exception e) {
                throw new IOException("Cloudinary upload failed: " + e.getMessage(), e);
            }
        }

        // Local fallback
        Path dir = uploadRoot.resolve(folder);
        Files.createDirectories(dir);
        String ext = "";
        String name = file.getOriginalFilename();
        if (name != null && name.lastIndexOf('.') >= 0)
            ext = name.substring(name.lastIndexOf('.')).toLowerCase();
        String fn = UUID.randomUUID() + ext;
        Path target = dir.resolve(fn);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        // Return a URL-friendly path (forward slashes)
        return new UploadResult("/uploads/" + folder + "/" + fn, "");
    }

    public void delete(String url, String publicId) {
        if (url == null || url.isBlank()) return;
        try {
            if (config.enabled() && publicId != null && !publicId.isBlank()) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
            } else if (url.startsWith("/uploads/")) {
                // Strip the "/uploads/" prefix and resolve against uploadRoot's parent
                String relative = url.substring("/uploads/".length());
                Path toDelete = uploadRoot.resolve(relative).normalize();
                // Security: ensure the resolved path is still within uploadRoot
                if (toDelete.startsWith(uploadRoot)) {
                    Files.deleteIfExists(toDelete);
                }
            }
        } catch (Exception ignored) {}
    }

    public record UploadResult(String url, String publicId) {}
}

