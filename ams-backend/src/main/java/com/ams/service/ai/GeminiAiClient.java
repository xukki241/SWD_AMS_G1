package com.ams.service.ai;

import com.ams.exception.AiGenerationException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Gemini implementation. The API key is read from GEMINI_API_KEY (never hardcoded).
 */
@Slf4j
@Component
public class GeminiAiClient implements AiClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiAiClient(
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.model:gemini-3.6-flash}") String model,
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${gemini.timeout-seconds:30}") int timeoutSeconds,
            ObjectMapper objectMapper) {

        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.baseUrl = baseUrl;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(timeoutSeconds, 1) * 1000);
        requestFactory.setReadTimeout(Math.max(timeoutSeconds, 1) * 1000);
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    @Override
    public String generate(String prompt) {
        if (apiKey.isBlank()) {
            throw new AiGenerationException(
                    "AI is not configured. Ask an administrator to set the GEMINI_API_KEY environment variable.");
        }

        Map<String, Object> payload = Map.of(
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "responseMimeType", "application/json"
                )
        );

        try {
            // Read the raw bytes instead of relying on a message converter:
            // Gemini/gateways sometimes answer with application/octet-stream,
            // which Spring cannot convert to JsonNode or String.
            RawResponse raw = restClient.post()
                    .uri(baseUrl + "/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .exchange((request, response) -> new RawResponse(
                            response.getStatusCode().value(),
                            new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8)));

            int status = raw.status();
            if (status == 429) {
                throw new AiGenerationException("AI quota exceeded. Please wait a moment and try again.");
            }
            if (status == 400 || status == 401 || status == 403) {
                throw new AiGenerationException(
                        "The AI request was rejected. Check that GEMINI_API_KEY is valid.");
            }
            if (status == 404) {
                throw new AiGenerationException(
                        "The configured Gemini model was not found. Set GEMINI_MODEL to an available model, such as gemini-3.6-flash.");
            }
            if (status < 200 || status >= 300) {
                log.warn("Gemini request failed with status {}", status);
                throw new AiGenerationException(
                        "The AI service returned an error (" + status + "). Please try again.");
            }

            String body = raw.body();
            JsonNode response = body == null || body.isBlank() ? null : objectMapper.readTree(body);
            String text = extractCandidateText(response);
            if (text == null || text.isBlank()) {
                throw new AiGenerationException("The AI returned an empty outline. Please try again.");
            }
            return text;
        } catch (JsonProcessingException ex) {
            throw new AiGenerationException("The AI response could not be understood. Please regenerate the outline.", ex);
        } catch (ResourceAccessException ex) {
            throw new AiGenerationException("The AI request timed out. Please try again.", ex);
        } catch (AiGenerationException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Gemini request could not be completed: {}", ex.getMessage());
            throw new AiGenerationException("Could not reach the AI service. Please try again.", ex);
        }
    }

    private record RawResponse(int status, String body) {
    }

    static String extractCandidateText(JsonNode response) {
        return response == null
                ? null
                : response.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
    }
}
