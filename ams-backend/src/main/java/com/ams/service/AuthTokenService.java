package com.ams.service;

import com.ams.entity.AuthToken;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.repository.AuthTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthTokenService {
    private final AuthTokenRepository tokenRepository;
    private final SecureRandom random = new SecureRandom();

    public String issue(User user, AuthToken.TokenType type, long minutes) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepository.save(AuthToken.builder()
                .user(user).tokenHash(hash(token)).tokenType(type)
                .expiresAt(LocalDateTime.now().plusMinutes(minutes)).build());
        return token;
    }

    public User consume(String token, AuthToken.TokenType type) {
        if (token == null || token.isBlank()) throw new BadRequestException("Invalid or expired token");
        AuthToken record = tokenRepository.findByTokenHashAndTokenTypeAndUsedAtIsNull(hash(token), type)
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new BadRequestException("Invalid or expired token"));
        record.setUsedAt(LocalDateTime.now());
        tokenRepository.save(record);
        return record.getUser();
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
