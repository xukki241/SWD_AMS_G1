package com.ams.service;

import com.ams.entity.ClassRegistration;
import com.ams.entity.Role;
import com.ams.entity.SubjectClass;
import com.ams.entity.User;
import com.ams.repository.ClassRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClassMembershipService {

    private final ClassRegistrationRepository registrationRepository;
    private final RoleChecker roleChecker;

    /**
     * A user may access a class when: admin; the class's teacher or expert;
     * or a student with an ACTIVE registration for the class.
     */
    @Transactional(readOnly = true)
    public boolean isMember(User user, SubjectClass subjectClass) {
        boolean isTeacher = subjectClass.getTeacher() != null && user.getId().equals(subjectClass.getTeacher().getId());
        boolean isExpert = subjectClass.getExpert() != null && user.getId().equals(subjectClass.getExpert().getId());
        if (isTeacher || isExpert) {
            return true;
        }
        if (roleChecker.hasRole(user.getId(), Role.RoleName.ADMIN)) {
            return true;
        }
        if (roleChecker.hasRole(user.getId(), Role.RoleName.STUDENT)) {
            return registrationRepository.findByStudentIdAndSubjectClassId(user.getId(), subjectClass.getId())
                    .map(r -> r.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE)
                    .orElse(false);
        }
        return false;
    }
}
