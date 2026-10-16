package com.aismartcivic.mapper;

import com.aismartcivic.domain.entity.Complaint;
import com.aismartcivic.domain.entity.ComplaintStatusHistory;
import com.aismartcivic.domain.entity.Department;
import com.aismartcivic.domain.entity.User;
import com.aismartcivic.dto.ComplaintResponse;
import com.aismartcivic.dto.ComplaintSummaryResponse;
import com.aismartcivic.dto.TimelineEventResponse;
import org.springframework.stereotype.Component;

@Component
public class ComplaintMapper {

    public ComplaintSummaryResponse toSummary(Complaint complaint) {
        Department department = complaint.getDepartment();
        return new ComplaintSummaryResponse(
                complaint.getId(),
                complaint.getComplaintNumber(),
                complaint.getTitle(),
                complaint.getIssueType(),
                complaint.getPriority(),
                complaint.getStatus(),
                department == null ? null : department.getName(),
                complaint.getReportedAt()
        );
    }

    public ComplaintResponse toResponse(Complaint complaint) {
        User citizen = complaint.getCitizen();
        User officer = complaint.getOfficer();
        Department department = complaint.getDepartment();
        return new ComplaintResponse(
                complaint.getId(),
                complaint.getComplaintNumber(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getIssueType(),
                complaint.getPriority(),
                complaint.getStatus(),
                complaint.getLatitude(),
                complaint.getLongitude(),
                complaint.getLocationAddress(),
                toPublicFileUrl(complaint.getBeforeImageUrl()),
                toPublicFileUrl(complaint.getAfterImageUrl()),
                complaint.getAiSummary(),
                complaint.getAiConfidence(),
                complaint.getAiProcessingStatus(),
                complaint.getOfficerRemarks(),
                complaint.getReportedAt(),
                complaint.getAssignedAt(),
                complaint.getResolvedAt(),
                complaint.getClosedAt(),
                citizen.getId(),
                citizen.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getName(),
                officer == null ? null : officer.getId(),
                officer == null ? null : officer.getName()
        );
    }

    public TimelineEventResponse toTimeline(ComplaintStatusHistory history) {
        User changedBy = history.getChangedBy();
        return new TimelineEventResponse(
                history.getOldStatus(),
                history.getNewStatus(),
                changedBy == null ? "System" : changedBy.getName(),
                history.getRemarks(),
                history.getChangedAt()
        );
    }

    private String toPublicFileUrl(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return null;
        }
        return "/api/files/" + storedPath;
    }
}
