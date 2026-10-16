package com.aismartcivic.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai")
public record AiProperties(
        boolean enabled,
        String apiKey,
        String model,
        String baseUrl,
        int timeoutSeconds
) {
    public AiProperties {
        if (model == null || model.isBlank()) {
            model = "gemini-1.5-flash";
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://generativelanguage.googleapis.com";
        }
        if (timeoutSeconds <= 0) {
            timeoutSeconds = 5;
        }
    }
}
