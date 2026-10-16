package com.aismartcivic.ai;

import com.aismartcivic.domain.FallbackIssueClassifier;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class GeminiAiClassifier implements AiIssueClassifier {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiClassifier.class);

    private final AiProperties aiProperties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Autowired
    public GeminiAiClassifier(AiProperties aiProperties, java.util.Optional<RestClient.Builder> restClientBuilder, ObjectMapper objectMapper) {
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;

        RestClient.Builder builder = restClientBuilder.orElseGet(RestClient::builder);
        if (restClientBuilder.isEmpty()) {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            int timeoutMs = aiProperties.timeoutSeconds() * 1000;
            requestFactory.setConnectTimeout(timeoutMs);
            requestFactory.setReadTimeout(timeoutMs);
            builder.requestFactory(requestFactory);
        }

        this.restClient = builder
                .baseUrl(aiProperties.baseUrl())
                .build();
    }

    // Constructor for direct RestClient injection in unit tests
    public GeminiAiClassifier(AiProperties aiProperties, RestClient restClient, ObjectMapper objectMapper) {
        this.aiProperties = aiProperties;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public AiClassificationResult classify(String title, String description, String imageUrl) {
        if (!aiProperties.enabled() || aiProperties.apiKey() == null || aiProperties.apiKey().isBlank()) {
            log.debug("AI classification disabled or API key not provided; using fallback classifier");
            IssueType fallbackType = FallbackIssueClassifier.classify(title, description);
            return AiClassificationResult.fallback(
                    fallbackType,
                    fallbackType.defaultPriority(),
                    "Classified using fallback rules. AI provider is not enabled."
            );
        }

        try {
            String prompt = buildPrompt(title, description, imageUrl);
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.1,
                            "responseMimeType", "application/json"
                    )
            );

            String uri = "/v1beta/models/" + aiProperties.model() + ":generateContent?key=" + aiProperties.apiKey();

            String responseBody = restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                throw new IllegalStateException("Empty response body received from Gemini API");
            }

            return parseGeminiResponse(responseBody, title, description);
        } catch (Exception ex) {
            log.warn("Gemini AI classification failed; gracefully falling back to rule classifier: {}", ex.getMessage());
            IssueType fallbackType = FallbackIssueClassifier.classify(title, description);
            return AiClassificationResult.fallback(
                    fallbackType,
                    fallbackType.defaultPriority(),
                    "Classified using fallback rules after AI provider error: " + ex.getClass().getSimpleName()
            );
        }
    }

    private String buildPrompt(String title, String description, String imageUrl) {
        return """
                You are an expert municipal AI classifier for civic governance complaints.
                Analyze this civic issue report submitted by a citizen:
                Title: %s
                Description: %s
                Image URL: %s

                Classify the issue into EXACTLY ONE of the following valid IssueType enums:
                - POTHOLES_ROAD_DAMAGE
                - STREETLIGHT_NOT_WORKING
                - GARBAGE_OVERFLOW
                - WATER_LEAKAGE
                - OPEN_BLOCKED_GUTTER_CHAMBER
                - DRAINAGE_BLOCKAGE
                - RIVER_PLASTIC_WASTE
                - FALLEN_TREE_ROAD_OBSTRUCTION

                Assign a priority (LOW, MEDIUM, HIGH, CRITICAL) and provide a confidence score between 0.0 and 1.0.

                Respond strictly with a JSON object in this exact schema:
                {
                  "issueType": "ONE_OF_THE_ENUMS_ABOVE",
                  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
                  "confidence": 0.95,
                  "summary": "1-2 sentence explanation of the detected issue and urgency"
                }
                """.formatted(
                title != null ? title : "",
                description != null ? description : "",
                imageUrl != null ? imageUrl : "None"
        );
    }

    private AiClassificationResult parseGeminiResponse(String responseBody, String title, String description) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new IllegalStateException("No candidate returned by Gemini");
            }

            JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new IllegalStateException("Missing text content in Gemini response candidate");
            }

            String jsonText = textNode.asText().trim();
            // In case output has markdown code block fences:
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
            } else if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3);
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }
            jsonText = jsonText.trim();

            JsonNode payload = objectMapper.readTree(jsonText);
            String issueTypeStr = payload.path("issueType").asText(null);
            String priorityStr = payload.path("priority").asText(null);
            double confidence = payload.path("confidence").asDouble(0.9);
            String summary = payload.path("summary").asText("AI classified civic issue");

            IssueType issueType;
            try {
                issueType = IssueType.valueOf(issueTypeStr);
            } catch (Exception ex) {
                log.warn("Gemini returned unrecognized issueType '{}', using fallback classifier", issueTypeStr);
                issueType = FallbackIssueClassifier.classify(title, description);
            }

            Priority priority;
            try {
                priority = Priority.valueOf(priorityStr);
            } catch (Exception ex) {
                priority = issueType.defaultPriority();
            }

            // Bound confidence between 0.0 and 1.0
            confidence = Math.max(0.0, Math.min(1.0, confidence));

            return AiClassificationResult.success(issueType, priority, confidence, summary);
        } catch (Exception ex) {
            log.warn("Failed to parse Gemini output JSON, falling back: {}", ex.getMessage());
            IssueType fallbackType = FallbackIssueClassifier.classify(title, description);
            return AiClassificationResult.fallback(
                    fallbackType,
                    fallbackType.defaultPriority(),
                    "Classified using fallback rules after AI parse failure"
            );
        }
    }
}
