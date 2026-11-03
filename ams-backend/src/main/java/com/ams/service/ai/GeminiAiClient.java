package com.ams.service.ai;

import com.ams.exception.AiGenerationException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

/**
 * Gemini implementation. The API key is read from GEMINI_API_KEY (never hardcoded).
 */
@Slf4j
@Component
public class GeminiAiClient implements AiClient {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiAiClient(
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.model:gemini-2.0-flash}") String model,
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${gemini.timeout-seconds:30}") int timeoutSeconds) {

        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.baseUrl = baseUrl;

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
            JsonNode response = restClient.post()
                    .uri(baseUrl + "/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);

            String text = response == null
                    ? null
                    : response.path("candidates").path(0).path("content").path(0).path("text").asText(null);
            if (text == null || text.isBlank()) {
                throw new AiGenerationException("The AI returned an empty outline. Please try again.");
            }
            return text;
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            log.warn("Gemini request failed with status {}", status);
            if (status == 429) {
                throw new AiGenerationException("AI quota exceeded. Please wait a moment and try again.", ex);
            }
            if (status == 400 || status == 401 || status == 403) {
                throw new AiGenerationException(
                        "The AI request was rejected. Check that GEMINI_API_KEY is valid.", ex);
            }
            throw new AiGenerationException("The AI service returned an error (" + status + "). Please try again.", ex);
        } catch (ResourceAccessException ex) {
            throw new AiGenerationException("The AI request timed out. Please try again.", ex);
        } catch (AiGenerationException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Gemini request could not be completed: {}", ex.getMessage());
            throw new AiGenerationException("Could not reach the AI service. Please try again.", ex);
        }
    }
}
