package com.greenlink.security;
import io.jsonwebtoken.*; import io.jsonwebtoken.security.Keys; import java.nio.charset.StandardCharsets; import javax.crypto.SecretKey; import java.util.Date; import org.springframework.beans.factory.annotation.Value; import org.springframework.stereotype.Service;
@Service public class JwtService {
 private final SecretKey key; private final long expiration;
 public JwtService(@Value("${app.jwt.secret}") String secret,@Value("${app.jwt.expiration-ms}") long expiration){ if(secret.length()<32) throw new IllegalArgumentException("JWT_SECRET must be at least 32 characters"); key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.expiration=expiration; }
 public String generate(String userId){ Date now=new Date(); return Jwts.builder().subject(userId).issuedAt(now).expiration(new Date(now.getTime()+expiration)).signWith(key).compact(); }
 public String extractUserId(String token){ return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject(); }
 public boolean isValid(String token){ try { extractUserId(token); return true; } catch(JwtException|IllegalArgumentException e){return false;} }
}

