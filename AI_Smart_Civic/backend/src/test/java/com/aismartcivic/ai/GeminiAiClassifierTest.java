package com.aismartcivic.ai;

import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiAiClassifierTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void whenDisabled_fallsBackToRuleClassifier() {
        AiProperties properties = new AiProperties(false, "test-key", "gemini-1.5-flash", "https://api.test", 5);
        GeminiAiClassifier classifier = new GeminiAiClassifier(properties, Optional.empty(), objectMapper);

        AiClassificationResult result = classifier.classify("Huge pothole on street", "Cars are getting damaged", "/before.jpg");

        assertThat(result.status()).isEqualTo(AiProcessingStatus.FALLBACK);
        assertThat(result.issueType()).isEqualTo(IssueType.POTHOLES_ROAD_DAMAGE);
        assertThat(result.priority()).isEqualTo(Priority.HIGH);
        assertThat(result.confidence()).isNull();
    }

    @Test
    void whenApiKeyMissing_fallsBackToRuleClassifier() {
        AiProperties properties = new AiProperties(true, "", "gemini-1.5-flash", "https://api.test", 5);
        GeminiAiClassifier classifier = new GeminiAiClassifier(properties, Optional.empty(), objectMapper);

        AiClassificationResult result = classifier.classify("Garbage pile near market", "Not cleaned for a week", "/before.jpg");

        assertThat(result.status()).isEqualTo(AiProcessingStatus.FALLBACK);
        assertThat(result.issueType()).isEqualTo(IssueType.GARBAGE_OVERFLOW);
    }

    @Test
    void whenGeminiSucceeds_returnsSuccessResult() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

        AiProperties properties = new AiProperties(true, "secret-key", "gemini-1.5-flash", "https://api.test", 5);
        GeminiAiClassifier classifier = new GeminiAiClassifier(properties, Optional.of(builder), objectMapper);

        String mockGeminiResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"issueType\\":\\"WATER_LEAKAGE\\",\\"priority\\":\\"HIGH\\",\\"confidence\\":0.92,\\"summary\\":\\"Major pipe burst causing clean water wastage on roadway.\\"}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        server.expect(requestTo("https://api.test/v1beta/models/gemini-1.5-flash:generateContent?key=secret-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(mockGeminiResponse, MediaType.APPLICATION_JSON));

        AiClassificationResult result = classifier.classify("Broken pipeline", "Water flooding the corner", "/water.jpg");

        assertThat(result.status()).isEqualTo(AiProcessingStatus.SUCCESS);
        assertThat(result.issueType()).isEqualTo(IssueType.WATER_LEAKAGE);
        assertThat(result.priority()).isEqualTo(Priority.HIGH);
        assertThat(result.confidence()).isEqualTo(0.92);
        assertThat(result.summary()).contains("Major pipe burst");
        server.verify();
    }

    @Test
    void whenGeminiReturnsMarkdownFencedJson_parsesCorrectly() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

        AiProperties properties = new AiProperties(true, "secret-key", "gemini-1.5-flash", "https://api.test", 5);
        GeminiAiClassifier classifier = new GeminiAiClassifier(properties, Optional.of(builder), objectMapper);

        String mockGeminiResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "```json\\n{\\"issueType\\":\\"STREETLIGHT_NOT_WORKING\\",\\"priority\\":\\"MEDIUM\\",\\"confidence\\":0.88,\\"summary\\":\\"Dark alley due to fused bulb.\\"}\\n```"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        server.expect(requestTo("https://api.test/v1beta/models/gemini-1.5-flash:generateContent?key=secret-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(mockGeminiResponse, MediaType.APPLICATION_JSON));

        AiClassificationResult result = classifier.classify("Dark road pole 12", "Light out", "/lamp.jpg");

        assertThat(result.status()).isEqualTo(AiProcessingStatus.SUCCESS);
        assertThat(result.issueType()).isEqualTo(IssueType.STREETLIGHT_NOT_WORKING);
        assertThat(result.confidence()).isEqualTo(0.88);
        server.verify();
    }

    @Test
    void whenGeminiReturnsUnknownIssueType_fallsBack() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

        AiProperties properties = new AiProperties(true, "secret-key", "gemini-1.5-flash", "https://api.test", 5);
        GeminiAiClassifier classifier = new GeminiAiClassifier(properties, Optional.of(builder), objectMapper);

        String mockGeminiResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"issueType\\":\\"UNKNOWN_CIVIC_THING\\",\\"priority\\":\\"LOW\\",\\"confidence\\":0.5,\\"summary\\":\\"Unsure\\"}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        server.expect(requestTo("https://api.test/v1beta/models/gemini-1.5-flash:generateContent?key=secret-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(mockGeminiResponse, MediaType.APPLICATION_JSON));

        AiClassificationResult result = classifier.classify("Clogged drain chamber", "Water not flowing", "/drain.jpg");

        assertThat(result.status()).isEqualTo(AiProcessingStatus.SUCCESS);
        assertThat(result.issueType()).isEqualTo(IssueType.OPEN_BLOCKED_GUTTER_CHAMBER);
        server.verify();
    }

    @Test
    void whenGeminiThrowsHttpError_fallsBackGracefully() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

        AiProperties properties = new AiProperties(true, "secret-key", "gemini-1.5-flash", "https://api.test", 5);
        GeminiAiClassifier classifier = new GeminiAiClassifier(properties, Optional.of(builder), objectMapper);

        server.expect(requestTo("https://api.test/v1beta/models/gemini-1.5-flash:generateContent?key=secret-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        AiClassificationResult result = classifier.classify("Tree fell down", "Blocking the street", "/tree.jpg");

        assertThat(result.status()).isEqualTo(AiProcessingStatus.FALLBACK);
        assertThat(result.issueType()).isEqualTo(IssueType.FALLEN_TREE_ROAD_OBSTRUCTION);
        server.verify();
    }
}
