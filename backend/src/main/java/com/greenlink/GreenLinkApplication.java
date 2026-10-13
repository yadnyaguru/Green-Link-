package com.greenlink;

import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class GreenLinkApplication {
    public static void main(String[] args) { SpringApplication.run(GreenLinkApplication.class, args); }

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of("status", "ok", "message", "GreenLink Spring Boot Backend is running");
    }
}
