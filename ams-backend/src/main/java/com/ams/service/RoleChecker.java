package com.ams.service;

import com.ams.entity.Role;
import com.ams.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleChecker {

    private final UserRoleRepository userRoleRepository;

    @Transactional(readOnly = true)
    public Set<Role.RoleName> rolesOf(Long userId) {
        Set<Role.RoleName> roles = new HashSet<>();
        userRoleRepository.findActiveRolesByUserId(userId).forEach(ur -> roles.add(ur.getRole().getRoleName()));
        return roles;
    }

    @Transactional(readOnly = true)
    public boolean hasRole(Long userId, Role.RoleName... needed) {
        Set<Role.RoleName> held = rolesOf(userId);
        for (Role.RoleName role : needed) {
            if (held.contains(role)) {
                return true;
            }
        }
        return false;
    }
}
