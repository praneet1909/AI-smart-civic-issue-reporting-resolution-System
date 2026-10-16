package com.aismartcivic.dto;

import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.ComplaintStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;

import java.time.Instant;

public record ComplaintResponse(
        Long id,
        String complaintNumber,
        String title,
        String description,
        IssueType issueType,
        Priority priority,
        ComplaintStatus status,
        Double latitude,
        Double longitude,
        String locationAddress,
        String beforeImageUrl,
        String afterImageUrl,
        String aiSummary,
        Double aiConfidence,
        AiProcessingStatus aiProcessingStatus,
        String officerRemarks,
        Instant reportedAt,
        Instant assignedAt,
        Instant resolvedAt,
        Instant closedAt,
        Long citizenId,
        String citizenName,
        Long departmentId,
        String departmentName,
        Long officerId,
        String officerName
) {
}
