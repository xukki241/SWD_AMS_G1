package com.ams.repository;

import com.ams.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByCourseEnrollmentId(Long courseEnrollmentId);
    Optional<PaymentTransaction> findByProviderAndProviderReference(String provider, String providerReference);

    @Query("""
            SELECT t FROM PaymentTransaction t
            JOIN FETCH t.courseEnrollment e
            JOIN FETCH e.course c
            JOIN FETCH e.student s
            WHERE c.instructor.id = :instructorId
            ORDER BY t.createdAt DESC
            """)
    List<PaymentTransaction> findByCourseInstructorId(@Param("instructorId") Long instructorId);
}
