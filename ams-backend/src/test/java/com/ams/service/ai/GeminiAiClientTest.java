package com.ams.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class GeminiAiClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractsTextFromGeminiCandidateContentParts() throws Exception {
        JsonNode response = objectMapper.readTree("""
                {
                  "candidates": [{
                    "content": {
                      "role": "model",
                      "parts": [{"text": "{\\"modules\\":[{\\"title\\":\\"Introduction\\",\\"lessons\\":[]}]}"}]
                    }
                  }]
                }
                """);

        assertEquals(
                "{\"modules\":[{\"title\":\"Introduction\",\"lessons\":[]}]}",
                GeminiAiClient.extractCandidateText(response)
        );
    }

    @Test
    void returnsNullWhenGeminiResponseHasNoCandidateText() {
        assertNull(GeminiAiClient.extractCandidateText(objectMapper.createObjectNode()));
    }
}
