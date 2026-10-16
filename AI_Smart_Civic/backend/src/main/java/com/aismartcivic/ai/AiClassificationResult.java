package com.aismartcivic.ai;

import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;

public record AiClassificationResult(
        IssueType issueType,
        Priority priority,
        Double confidence,
        String summary,
        AiProcessingStatus status
) {
    public static AiClassificationResult fallback(IssueType issueType, Priority priority, String summary) {
        return new AiClassificationResult(
                issueType,
                priority,
                null,
                summary,
                AiProcessingStatus.FALLBACK
        );
    }

    public static AiClassificationResult success(IssueType issueType, Priority priority, Double confidence, String summary) {
        return new AiClassificationResult(
                issueType,
                priority,
                confidence,
                summary,
                AiProcessingStatus.SUCCESS
        );
    }

    public static AiClassificationResult failed(IssueType issueType, Priority priority, String summary) {
        return new AiClassificationResult(
                issueType,
                priority,
                null,
                summary,
                AiProcessingStatus.FAILED
        );
    }
}
