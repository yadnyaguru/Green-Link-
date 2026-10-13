package com.greenlink.service;

import com.greenlink.dto.AuthResponse;
import com.greenlink.dto.UserView;
import com.greenlink.model.User;
import com.greenlink.repository.UserRepository;
import com.greenlink.security.JwtService;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.regex.Pattern;
import org.bson.types.ObjectId;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService {

    private static final Pattern EMAIL_REGEX = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final MediaService media;

    public UserService(UserRepository r, PasswordEncoder e, JwtService j, MediaService m) {
        repo = r;
        encoder = e;
        jwt = j;
        media = m;
    }

    public AuthResponse register(String name, String email, String password, Boolean provider) {
        if (name == null || name.isBlank() || email == null || email.isBlank() || password == null || password.isBlank())
            throw new IllegalArgumentException("Please fill all fields");
        email = email.toLowerCase(Locale.ROOT).trim();
        if (!EMAIL_REGEX.matcher(email).matches())
            throw new IllegalArgumentException("Invalid email address");
        if (password.length() < 6)
            throw new IllegalArgumentException("Password must be at least 6 characters");
        if (repo.findByEmail(email).isPresent())
            throw new IllegalArgumentException("Email already registered");
        User u = new User();
        u.setName(name.trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(password));
        u.setProvider(Boolean.TRUE.equals(provider));
        repo.save(u);
        return auth(u);
    }

    public AuthResponse login(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank())
            throw new BadCredentialsException("Please enter both email and password.");
        User u = repo.findByEmail(email.toLowerCase(Locale.ROOT).trim()).orElse(null);
        if (u == null)
            throw new BadCredentialsException("No account found with this email. Please check your username/email and try again.");
        if (!encoder.matches(password, u.getPassword()))
            throw new BadCredentialsException("Incorrect password. Please verify your password and try again.");
        return auth(u);
    }

    private AuthResponse auth(User u) {
        return new AuthResponse(u.getId().toHexString(), u.getName(), u.getEmail(),
                u.isProvider(), u.getProfileImage(), jwt.generate(u.getId().toHexString()));
    }

    public User require(ObjectId id) {
        return repo.findById(Objects.requireNonNull(id)).orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    public UserView view(User u) {
        return new UserView(u.getId().toHexString(), u.getName(), u.getEmail(),
                u.isProvider(), u.getProfileImage());
    }

    public UserView publicView(ObjectId id) {
        return view(require(id));
    }

    public AuthResponse profileImage(ObjectId id, MultipartFile file) {
        User u = require(id);
        String oldUrl = u.getProfileImage();
        String oldPid = u.getProfileImagePublicId();
        try {
            var up = media.upload(file, "profiles");
            u.setProfileImage(up.url());
            u.setProfileImagePublicId(up.publicId());
            repo.save(u);
            // Delete old image only after successful save
            media.delete(oldUrl, oldPid);
            return auth(u);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Profile image upload failed: " + e.getMessage(), e);
        }
    }

    public UserView update(ObjectId id, String name, Boolean provider) {
        User u = require(id);
        if (name != null && !name.isBlank()) u.setName(name.trim());
        if (provider != null) u.setProvider(provider);
        repo.save(Objects.requireNonNull(u));
        return view(u);
    }
}
