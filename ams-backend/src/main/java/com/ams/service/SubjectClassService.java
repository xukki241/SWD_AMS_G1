package com.ams.service;

import com.ams.dto.SubjectClassDTO;
import com.ams.entity.Subject;
import com.ams.entity.SubjectClass;
import com.ams.entity.User;
import com.ams.exception.DuplicateResourceException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.SubjectClassRepository;
import com.ams.repository.SubjectRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectClassService {

    private final SubjectClassRepository subjectClassRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SubjectClassDTO.SubjectClassResponse> getAllClasses() {
        return subjectClassRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubjectClassDTO.SubjectClassResponse getClassById(Long id) {
        SubjectClass sc = subjectClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        return mapToResponse(sc);
    }

    @Transactional(readOnly = true)
    public List<SubjectClassDTO.SubjectClassResponse> getClassesByTeacher(Long teacherId) {
        return subjectClassRepository.findByTeacherId(teacherId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubjectClassDTO.SubjectClassResponse createClass(SubjectClassDTO.CreateSubjectClassRequest request) {
        if (subjectClassRepository.findByClassCode(request.classCode()).isPresent()) {
            throw new DuplicateResourceException("Class code '" + request.classCode() + "' already exists");
        }

        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.subjectId()));

        User expert = null;
        if (request.expertId() != null) {
            expert = userRepository.findById(request.expertId()).orElse(null);
        }

        User teacher = null;
        if (request.teacherId() != null) {
            teacher = userRepository.findById(request.teacherId()).orElse(null);
        }

        SubjectClass sc = SubjectClass.builder()
                .subject(subject)
                .expert(expert)
                .teacher(teacher)
                .classCode(request.classCode())
                .className(request.className())
                .term(request.term())
                .build();

        sc = subjectClassRepository.save(sc);
        auditLogService.log("CREATE_CLASS", "SubjectClass", sc.getClassCode());
        return mapToResponse(sc);
    }

    private SubjectClassDTO.SubjectClassResponse mapToResponse(SubjectClass sc) {
        return new SubjectClassDTO.SubjectClassResponse(
                sc.getId(),
                sc.getSubject().getId(),
                sc.getSubject().getSubjectCode(),
                sc.getSubject().getSubjectName(),
                sc.getExpert() != null ? sc.getExpert().getId() : null,
                sc.getExpert() != null ? sc.getExpert().getFullName() : null,
                sc.getTeacher() != null ? sc.getTeacher().getId() : null,
                sc.getTeacher() != null ? sc.getTeacher().getFullName() : null,
                sc.getClassCode(),
                sc.getClassName(),
                sc.getTerm()
        );
    }
}
