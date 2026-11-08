package com.ams.service.ai;

/**
 * Thin abstraction over the external AI provider. Implementations must return
 * the raw model text so {@link com.ams.service.AIService} can parse and validate it.
 * Mock this interface in unit tests.
 */
public interface AiClient {

    String generate(String prompt);

    default String generateWithFile(String prompt, String mimeType, byte[] bytes) {
        throw new UnsupportedOperationException("This AI provider does not support file grading");
    }
}
