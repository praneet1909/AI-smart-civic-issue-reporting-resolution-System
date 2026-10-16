package com.aismartcivic.domain.entity;

import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.ComplaintStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "complaints",
        indexes = {
                @Index(name = "idx_complaints_citizen_status", columnList = "citizen_id,status,reported_at"),
                @Index(name = "idx_complaints_officer_status", columnList = "officer_id,status"),
                @Index(name = "idx_complaints_department_status", columnList = "department_id,status")
        }
)
@EntityListeners(AuditingEntityListener.class)
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_number", nullable = false, unique = true, length = 32)
    private String complaintNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private IssueType issueType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintStatus status = ComplaintStatus.REPORTED;

    private Double latitude;

    private Double longitude;

    @Column(length = 500)
    private String locationAddress;

    @Column(length = 512)
    private String beforeImageUrl;

    @Column(length = 512)
    private String afterImageUrl;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    private Double aiConfidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiProcessingStatus aiProcessingStatus = AiProcessingStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String officerRemarks;

    @Column(nullable = false)
    private Instant reportedAt;

    private Instant assignedAt;

    private Instant resolvedAt;

    private Instant closedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "officer_id")
    private User officer;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("changedAt ASC")
    private List<ComplaintStatusHistory> statusHistory = new ArrayList<>();

    @OneToOne(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Feedback feedback;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    public void addStatusHistory(ComplaintStatusHistory history) {
        statusHistory.add(history);
        history.setComplaint(this);
    }

    public Long getId() {
        return id;
    }

    public String getComplaintNumber() {
        return complaintNumber;
    }

    public void setComplaintNumber(String complaintNumber) {
        this.complaintNumber = complaintNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public IssueType getIssueType() {
        return issueType;
    }

    public void setIssueType(IssueType issueType) {
        this.issueType = issueType;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocationAddress() {
        return locationAddress;
    }

    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }

    public String getBeforeImageUrl() {
        return beforeImageUrl;
    }

    public void setBeforeImageUrl(String beforeImageUrl) {
        this.beforeImageUrl = beforeImageUrl;
    }

    public String getAfterImageUrl() {
        return afterImageUrl;
    }

    public void setAfterImageUrl(String afterImageUrl) {
        this.afterImageUrl = afterImageUrl;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public Double getAiConfidence() {
        return aiConfidence;
    }

    public void setAiConfidence(Double aiConfidence) {
        this.aiConfidence = aiConfidence;
    }

    public AiProcessingStatus getAiProcessingStatus() {
        return aiProcessingStatus;
    }

    public void setAiProcessingStatus(AiProcessingStatus aiProcessingStatus) {
        this.aiProcessingStatus = aiProcessingStatus;
    }

    public String getOfficerRemarks() {
        return officerRemarks;
    }

    public void setOfficerRemarks(String officerRemarks) {
        this.officerRemarks = officerRemarks;
    }

    public Instant getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(Instant reportedAt) {
        this.reportedAt = reportedAt;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Instant assignedAt) {
        this.assignedAt = assignedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }

    public User getCitizen() {
        return citizen;
    }

    public void setCitizen(User citizen) {
        this.citizen = citizen;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public User getOfficer() {
        return officer;
    }

    public void setOfficer(User officer) {
        this.officer = officer;
    }

    public List<ComplaintStatusHistory> getStatusHistory() {
        return statusHistory;
    }

    public Feedback getFeedback() {
        return feedback;
    }

    public void setFeedback(Feedback feedback) {
        this.feedback = feedback;
        if (feedback != null) {
            feedback.setComplaint(this);
        }
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
