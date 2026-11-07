package com.ams.service;

import com.ams.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailDeliveryService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.host:}") private String mailHost;
    @Value("${app.mail.from:no-reply@ams.local}") private String from;
    @Value("${app.web-url:http://localhost:3000}") private String webUrl;

    public void sendVerification(String email, String token) {
        send(email, "Verify your AMS email", "Verify your account: " + webUrl + "/verify-email?token=" + token);
    }

    public void sendPasswordReset(String email, String token) {
        send(email, "Reset your AMS password", "Reset your password: " + webUrl + "/reset-password?token=" + token);
    }

    public void sendGradePublished(String email, String assignmentTitle) {
        send(email, "Your assignment grade is available",
                "Your teacher published feedback for '" + assignmentTitle + "'. Sign in to AMS Classroom and open Submission History & Feedback.");
    }

    private void send(String to, String subject, String text) {
        if (mailHost.isBlank() || mailSenderProvider.getIfAvailable() == null) {
            throw new BadRequestException("Email delivery is not configured. Set MAIL_HOST and mail credentials.");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSenderProvider.getObject().send(message);
    }
}
