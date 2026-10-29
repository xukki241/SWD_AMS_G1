package com.ams.repository;

import com.ams.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByClassRegistrationId(Long classRegistrationId);
    Optional<PaymentTransaction> findByProviderAndProviderReference(String provider, String providerReference);
}
