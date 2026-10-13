package com.greenlink.service;

import com.greenlink.dto.AuthResponse;
import com.greenlink.dto.UserView;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService users;

    public AuthService(UserService users) {
        this.users = users;
    }

    public AuthResponse register(String name, String email, String password, Boolean isProvider) {
        return users.register(name, email, password, isProvider);
    }

    public AuthResponse login(String email, String password) {
        return users.login(email, password);
    }

    public UserView me(ObjectId id) {
        return users.view(users.require(id));
    }
}
