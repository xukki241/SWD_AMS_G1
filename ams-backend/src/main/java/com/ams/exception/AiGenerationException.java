package com.ams.exception;

/**
 * Raised when the external AI provider cannot produce a usable outline.
 * Mapped to HTTP 502 so the UI can show a friendly retry message.
 */
public class AiGenerationException extends RuntimeException {

    public AiGenerationException(String message) {
        super(message);
    }

    public AiGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
