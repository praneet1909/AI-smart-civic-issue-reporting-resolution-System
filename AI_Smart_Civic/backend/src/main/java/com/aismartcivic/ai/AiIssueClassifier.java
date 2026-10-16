package com.aismartcivic.ai;

/**
 * Port / interface for classifying civic issues using AI or fallback providers.
 */
public interface AiIssueClassifier {

    /**
     * Classifies a complaint based on its title, description, and optional image URL.
     *
     * @param title       complaint title
     * @param description complaint description
     * @param imageUrl    relative or absolute URL to the complaint before-photo
     * @return classification result containing predicted issue type, priority, confidence, and status
     */
    AiClassificationResult classify(String title, String description, String imageUrl);
}
