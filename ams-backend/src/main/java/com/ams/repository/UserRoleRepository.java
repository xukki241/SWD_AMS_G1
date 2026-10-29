package com.ams.repository;

import com.ams.entity.User;
import com.ams.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    List<UserRole> findByUser(User user);
    List<UserRole> findByUserIdAndAssignmentStatus(Long userId, UserRole.AssignmentStatus status);

    @Query("SELECT ur FROM UserRole ur JOIN FETCH ur.role WHERE ur.user.id = :userId AND ur.assignmentStatus = 'ACTIVE'")
    List<UserRole> findActiveRolesByUserId(@Param("userId") Long userId);
}
