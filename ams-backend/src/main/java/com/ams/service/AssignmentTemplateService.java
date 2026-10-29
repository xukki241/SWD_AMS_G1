package com.ams.service;

import com.ams.dto.AssignmentDTO;
import com.ams.entity.AssignmentTemplate;
import com.ams.entity.Subject;
import com.ams.entity.User;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentTemplateRepository;
import com.ams.repository.SubjectRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentTemplateService {

    private final AssignmentTemplateRepository templateRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<AssignmentDTO.AssignmentTemplateResponse> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentDTO.AssignmentTemplateResponse> getTemplatesBySubject(Long subjectId) {
        return templateRepository.findBySubjectId(subjectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentDTO.AssignmentTemplateResponse createTemplate(AssignmentDTO.CreateTemplateRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User expert = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Expert user not found: " + username));

        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.subjectId()));

        AssignmentTemplate template = AssignmentTemplate.builder()
                .subject(subject)
                .expert(expert)
                .title(request.title())
                .instructions(request.instructions())
                .defaultDueRule(request.defaultDueRule())
                .build();

        template = templateRepository.save(template);
        auditLogService.log("CREATE_TEMPLATE", "AssignmentTemplate", template.getTitle());
        return mapToResponse(template);
    }

    private AssignmentDTO.AssignmentTemplateResponse mapToResponse(AssignmentTemplate t) {
        return new AssignmentDTO.AssignmentTemplateResponse(
                t.getId(),
                t.getSubject().getId(),
                t.getSubject().getSubjectName(),
                t.getExpert().getId(),
                t.getExpert().getFullName(),
                t.getTitle(),
                t.getInstructions(),
                t.getDefaultDueRule()
        );
    }
}
