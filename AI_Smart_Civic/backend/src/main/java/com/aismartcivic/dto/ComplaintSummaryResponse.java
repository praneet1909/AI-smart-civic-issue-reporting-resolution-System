package com.aismartcivic.dto;

import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.ComplaintStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;

import java.time.Instant;

public record ComplaintSummaryResponse(
        Long id,
        String complaintNumber,
        String title,
        IssueType issueType,
        Priority priority,
        ComplaintStatus status,
        String departmentName,
        Instant reportedAt
) {
}
