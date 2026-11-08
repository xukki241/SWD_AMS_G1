package com.ams.repository;

import com.ams.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    Optional<AuthToken> findByTokenHashAndTokenTypeAndUsedAtIsNull(String tokenHash, AuthToken.TokenType tokenType);
}
