package com.ams.security;

import com.ams.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Verifies Firebase Auth ID tokens using Google's JWKS (no Admin SDK required).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FirebaseTokenVerifier {

    private static final String JWKS_URL =
            "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

    private final ObjectMapper objectMapper;

    @Value("${app.firebase.project-id:}")
    private String projectId;

    private final Map<String, RSAPublicKey> keyCache = new ConcurrentHashMap<>();
    private volatile long keysFetchedAtMs = 0L;

    public boolean isConfigured() {
        return projectId != null && !projectId.isBlank();
    }

    public record VerifiedFirebaseUser(String uid, String email, String fullName, boolean emailVerified) {}

    public VerifiedFirebaseUser verify(String idToken) {
        if (!isConfigured()) {
            throw new BadRequestException("Firebase Google sign-in is not configured");
        }
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) throw new BadRequestException("Google credential is invalid");
            JsonNode header = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
            String kid = header.path("kid").asText(null);
            if (kid == null || kid.isBlank()) throw new BadRequestException("Google credential is invalid");

            RSAPublicKey key = resolveKey(kid);
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer("https://securetoken.google.com/" + projectId)
                    .requireAudience(projectId)
                    .build()
                    .parseSignedClaims(idToken)
                    .getPayload();

            String email = claims.get("email", String.class);
            if (email == null || email.isBlank()) {
                throw new BadRequestException("Google account must have a verified email");
            }
            Boolean verified = claims.get("email_verified", Boolean.class);
            String name = claims.get("name", String.class);
            return new VerifiedFirebaseUser(
                    claims.getSubject(),
                    email.toLowerCase(Locale.ROOT),
                    name != null && !name.isBlank() ? name : email,
                    verified == null || verified
            );
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Firebase token verify failed: {}", ex.getMessage());
            throw new BadRequestException("Google credential is invalid");
        }
    }

    private RSAPublicKey resolveKey(String kid) throws Exception {
        RSAPublicKey cached = keyCache.get(kid);
        if (cached != null && System.currentTimeMillis() - keysFetchedAtMs < 3600_000) {
            return cached;
        }
        refreshKeys();
        RSAPublicKey key = keyCache.get(kid);
        if (key == null) {
            refreshKeys();
            key = keyCache.get(kid);
        }
        if (key == null) throw new BadRequestException("Google credential is invalid");
        return key;
    }

    private synchronized void refreshKeys() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(JWKS_URL))
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();
        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new BadRequestException("Could not verify Google sign-in");
        }
        JsonNode keys = objectMapper.readTree(response.body()).path("keys");
        keyCache.clear();
        for (JsonNode jwk : keys) {
            String kid = jwk.path("kid").asText();
            String n = jwk.path("n").asText();
            String e = jwk.path("e").asText();
            if (kid.isBlank() || n.isBlank() || e.isBlank()) continue;
            byte[] modulus = Base64.getUrlDecoder().decode(n);
            byte[] exponent = Base64.getUrlDecoder().decode(e);
            RSAPublicKeySpec spec = new RSAPublicKeySpec(new BigInteger(1, modulus), new BigInteger(1, exponent));
            PublicKey publicKey = KeyFactory.getInstance("RSA").generatePublic(spec);
            keyCache.put(kid, (RSAPublicKey) publicKey);
        }
        keysFetchedAtMs = System.currentTimeMillis();
    }
}
