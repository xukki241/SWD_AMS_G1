package com.ams.service;

import com.ams.dto.SubjectDTO;
import com.ams.entity.Subject;
import com.ams.exception.DuplicateResourceException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SubjectDTO.SubjectResponse> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubjectDTO.SubjectResponse getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        return mapToResponse(subject);
    }

    @Transactional
    public SubjectDTO.SubjectResponse createSubject(SubjectDTO.CreateSubjectRequest request) {
        if (subjectRepository.findBySubjectCode(request.subjectCode()).isPresent()) {
            throw new DuplicateResourceException("Subject code '" + request.subjectCode() + "' already exists");
        }

        Subject subject = Subject.builder()
                .subjectCode(request.subjectCode())
                .subjectName(request.subjectName())
                .description(request.description())
                .status(request.status() != null ? request.status() : Subject.SubjectStatus.ACTIVE)
                .build();

        subject = subjectRepository.save(subject);
        auditLogService.log("CREATE_SUBJECT", "Subject", subject.getSubjectCode());
        return mapToResponse(subject);
    }

    private SubjectDTO.SubjectResponse mapToResponse(Subject subject) {
        return new SubjectDTO.SubjectResponse(
                subject.getId(),
                subject.getSubjectCode(),
                subject.getSubjectName(),
                subject.getDescription(),
                subject.getStatus()
        );
    }
}
