package com.aismartcivic.service;

import com.aismartcivic.ai.AiClassificationResult;
import com.aismartcivic.ai.AiIssueClassifier;
import com.aismartcivic.common.dto.PageResponse;
import com.aismartcivic.common.exception.ForbiddenOperationException;
import com.aismartcivic.common.exception.InvalidFileException;
import com.aismartcivic.common.exception.InvalidStatusTransitionException;
import com.aismartcivic.common.exception.ResourceNotFoundException;
import com.aismartcivic.domain.IssueCategoryCatalog;
import com.aismartcivic.domain.entity.Complaint;
import com.aismartcivic.domain.entity.ComplaintStatusHistory;
import com.aismartcivic.domain.entity.Department;
import com.aismartcivic.domain.entity.Feedback;
import com.aismartcivic.domain.entity.User;
import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.ComplaintStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.dto.AssignComplaintRequest;
import com.aismartcivic.dto.CloseComplaintRequest;
import com.aismartcivic.dto.ComplaintResponse;
import com.aismartcivic.dto.ComplaintSummaryResponse;
import com.aismartcivic.dto.CreateComplaintRequest;
import com.aismartcivic.dto.CreateFeedbackRequest;
import com.aismartcivic.dto.FeedbackResponse;
import com.aismartcivic.dto.ResolveComplaintRequest;
import com.aismartcivic.dto.TimelineEventResponse;
import com.aismartcivic.dto.UpdateOfficerStatusRequest;
import com.aismartcivic.mapper.ComplaintMapper;
import com.aismartcivic.mapper.FeedbackMapper;
import com.aismartcivic.repository.FeedbackRepository;
import com.aismartcivic.repository.ComplaintRepository;
import com.aismartcivic.repository.ComplaintStatusHistoryRepository;
import com.aismartcivic.repository.DepartmentRepository;
import com.aismartcivic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.Year;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class ComplaintService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintService.class);
    private static final Set<ComplaintStatus> REASSIGNABLE =
            EnumSet.of(ComplaintStatus.ASSIGNED, ComplaintStatus.PENDING, ComplaintStatus.IN_PROGRESS);
    private static final Set<ComplaintStatus> CLOSABLE =
            EnumSet.of(ComplaintStatus.RESOLVED, ComplaintStatus.FEEDBACK);

    private final ComplaintRepository complaintRepository;
    private final ComplaintStatusHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final FeedbackRepository feedbackRepository;
    private final FileStorageService fileStorageService;
    private final ComplaintMapper complaintMapper;
    private final FeedbackMapper feedbackMapper;
    private final AiIssueClassifier aiIssueClassifier;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintStatusHistoryRepository historyRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            FeedbackRepository feedbackRepository,
            FileStorageService fileStorageService,
            ComplaintMapper complaintMapper,
            FeedbackMapper feedbackMapper,
            AiIssueClassifier aiIssueClassifier
    ) {
        this.complaintRepository = complaintRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.feedbackRepository = feedbackRepository;
        this.fileStorageService = fileStorageService;
        this.complaintMapper = complaintMapper;
        this.feedbackMapper = feedbackMapper;
        this.aiIssueClassifier = aiIssueClassifier;
    }

    @Transactional
    public ComplaintResponse create(Long citizenId, CreateComplaintRequest request, MultipartFile beforeImage) {
        if (beforeImage == null || beforeImage.isEmpty()) {
            throw new InvalidFileException("Before-resolution photo is required");
        }
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (citizen.getRole() != Role.CITIZEN) {
            throw new ForbiddenOperationException("Only citizens can report complaints");
        }

        String beforeImageUrl = fileStorageService.store("before", beforeImage);
        AiClassificationResult aiResult = aiIssueClassifier.classify(
                request.getTitle(), request.getDescription(), beforeImageUrl);

        IssueType issueType = aiResult.issueType();
        Priority priority = aiResult.priority() != null ? aiResult.priority() : issueType.defaultPriority();
        Department department = departmentRepository.findByName(issueType.defaultDepartmentName())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        Instant now = Instant.now();
        Complaint complaint = new Complaint();
        complaint.setComplaintNumber(nextComplaintNumber());
        complaint.setTitle(request.getTitle().trim());
        complaint.setDescription(request.getDescription().trim());
        complaint.setIssueType(issueType);
        complaint.setPriority(priority);
        complaint.setStatus(ComplaintStatus.REPORTED);
        complaint.setLatitude(request.getLatitude());
        complaint.setLongitude(request.getLongitude());
        complaint.setLocationAddress(blankToNull(request.getLocationAddress()));
        complaint.setBeforeImageUrl(beforeImageUrl);
        complaint.setAiSummary(aiResult.summary());
        complaint.setAiConfidence(aiResult.confidence());
        complaint.setAiProcessingStatus(aiResult.status());
        complaint.setReportedAt(now);
        complaint.setCitizen(citizen);
        complaint.setDepartment(department);
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, null, ComplaintStatus.REPORTED, citizen, "Complaint submitted"));
        complaint.setStatus(ComplaintStatus.AI_VERIFIED);

        String auditRemarks = "Issue classified as " + IssueCategoryCatalog.departmentName(issueType);
        if (aiResult.status() == AiProcessingStatus.SUCCESS && aiResult.confidence() != null) {
            auditRemarks += " (AI Confidence: " + String.format("%.0f%%", aiResult.confidence() * 100) + ")";
        }
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, ComplaintStatus.REPORTED, ComplaintStatus.AI_VERIFIED, citizen, auditRemarks));

        Complaint saved = complaintRepository.save(complaint);
        log.info("Complaint created {} by {} with AI status {}",
                saved.getComplaintNumber(), citizen.getEmail(), saved.getAiProcessingStatus());
        return complaintMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintSummaryResponse> listMine(Long citizenId, int page, int size) {
        return PageResponse.from(
                complaintRepository.findByCitizenId(citizenId, PageRequest.of(page, size, Sort.by("reportedAt").descending())),
                complaintMapper::toSummary
        );
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getMine(Long citizenId, Long complaintId) {
        Complaint complaint = complaintRepository.findDetailedByIdAndCitizenId(complaintId, citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        return complaintMapper.toResponse(complaint);
    }

    @Transactional(readOnly = true)
    public List<TimelineEventResponse> timelineMine(Long citizenId, Long complaintId) {
        if (complaintRepository.findByIdAndCitizenId(complaintId, citizenId).isEmpty()) {
            throw new ResourceNotFoundException("Complaint not found");
        }
        return historyRepository.findByComplaintIdOrderByChangedAtAsc(complaintId).stream()
                .map(complaintMapper::toTimeline)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintSummaryResponse> listAllForAdmin(int page, int size) {
        return PageResponse.from(
                complaintRepository.findAllDetailed(PageRequest.of(page, size, Sort.by("reportedAt").descending())),
                complaintMapper::toSummary
        );
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getForAdmin(Long complaintId) {
        Complaint complaint = complaintRepository.findDetailedById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        return complaintMapper.toResponse(complaint);
    }

    @Transactional(readOnly = true)
    public List<TimelineEventResponse> timelineForAdmin(Long complaintId) {
        if (!complaintRepository.existsById(complaintId)) {
            throw new ResourceNotFoundException("Complaint not found");
        }
        return historyRepository.findByComplaintIdOrderByChangedAtAsc(complaintId).stream()
                .map(complaintMapper::toTimeline)
                .toList();
    }

    @Transactional
    public ComplaintResponse assign(Long adminId, Long complaintId, AssignComplaintRequest request, boolean reassign) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findDetailedById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (reassign) {
            if (!REASSIGNABLE.contains(complaint.getStatus())) {
                throw InvalidStatusTransitionException.of(complaint.getStatus().name(), ComplaintStatus.ASSIGNED.name());
            }
        } else if (complaint.getStatus() != ComplaintStatus.AI_VERIFIED) {
            throw InvalidStatusTransitionException.of(complaint.getStatus().name(), ComplaintStatus.ASSIGNED.name());
        }

        User officer = userRepository.findById(request.officerId())
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));
        if (officer.getRole() != Role.OFFICER || !officer.isEnabled()) {
            throw new ForbiddenOperationException("Assignment target must be an enabled officer");
        }

        ComplaintStatus old = complaint.getStatus();
        complaint.setOfficer(officer);
        if (officer.getDepartment() != null) {
            complaint.setDepartment(officer.getDepartment());
        }
        complaint.setAssignedAt(Instant.now());
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, old, ComplaintStatus.ASSIGNED, admin,
                reassign ? "Complaint reassigned" : defaultRemarks(request.remarks(), "Complaint assigned")));
        complaint.setStatus(ComplaintStatus.PENDING);
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, ComplaintStatus.ASSIGNED, ComplaintStatus.PENDING, admin, "Waiting for officer action"));

        log.info("Complaint {} assigned to {}", complaint.getComplaintNumber(), officer.getEmail());
        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintSummaryResponse> listForOfficer(Long officerId, ComplaintStatus status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("reportedAt").descending());
        if (status != null) {
            return PageResponse.from(
                    complaintRepository.findByOfficerIdAndStatus(officerId, status, pageRequest),
                    complaintMapper::toSummary
            );
        }
        return PageResponse.from(
                complaintRepository.findByOfficerId(officerId, pageRequest),
                complaintMapper::toSummary
        );
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getForOfficer(Long officerId, Long complaintId) {
        Complaint complaint = complaintRepository.findDetailedByIdAndOfficerId(complaintId, officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        return complaintMapper.toResponse(complaint);
    }

    @Transactional(readOnly = true)
    public List<TimelineEventResponse> timelineForOfficer(Long officerId, Long complaintId) {
        if (complaintRepository.findByIdAndOfficerId(complaintId, officerId).isEmpty()) {
            throw new ResourceNotFoundException("Complaint not found");
        }
        return historyRepository.findByComplaintIdOrderByChangedAtAsc(complaintId).stream()
                .map(complaintMapper::toTimeline)
                .toList();
    }

    @Transactional
    public ComplaintResponse updateStatusByOfficer(Long officerId, Long complaintId, UpdateOfficerStatusRequest request) {
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findDetailedByIdAndOfficerId(complaintId, officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (complaint.getStatus() != ComplaintStatus.PENDING || request.status() != ComplaintStatus.IN_PROGRESS) {
            throw InvalidStatusTransitionException.of(complaint.getStatus().name(), request.status().name());
        }

        ComplaintStatus old = complaint.getStatus();
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, old, ComplaintStatus.IN_PROGRESS, officer,
                defaultRemarks(request.remarks(), "Officer started work on complaint")));

        log.info("Complaint {} status changed to IN_PROGRESS by officer {}",
                complaint.getComplaintNumber(), officer.getEmail());
        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintResponse resolveByOfficer(
            Long officerId,
            Long complaintId,
            ResolveComplaintRequest request,
            MultipartFile afterImage
    ) {
        if (afterImage == null || afterImage.isEmpty()) {
            throw new InvalidFileException("After-resolution photo is required");
        }
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findDetailedByIdAndOfficerId(complaintId, officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (complaint.getStatus() != ComplaintStatus.IN_PROGRESS) {
            throw InvalidStatusTransitionException.of(complaint.getStatus().name(), ComplaintStatus.RESOLVED.name());
        }

        String storedPath = fileStorageService.store("after", afterImage);
        Instant now = Instant.now();
        complaint.setAfterImageUrl(storedPath);
        complaint.setOfficerRemarks(request.getRemarks().trim());
        complaint.setResolvedAt(now);
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, officer,
                request.getRemarks().trim()));

        log.info("Complaint {} marked RESOLVED by officer {}",
                complaint.getComplaintNumber(), officer.getEmail());
        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    @Transactional
    public FeedbackResponse submitFeedback(Long citizenId, Long complaintId, CreateFeedbackRequest request) {
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findDetailedByIdAndCitizenId(complaintId, citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw InvalidStatusTransitionException.of(complaint.getStatus().name(), ComplaintStatus.FEEDBACK.name());
        }
        if (feedbackRepository.existsByComplaintId(complaintId)) {
            throw new ForbiddenOperationException("Feedback has already been submitted for this complaint");
        }

        Feedback feedback = new Feedback();
        feedback.setComplaint(complaint);
        feedback.setCitizen(citizen);
        feedback.setRating(request.rating());
        feedback.setComment(request.comment() != null ? request.comment().trim() : null);
        feedbackRepository.save(feedback);

        complaint.setFeedback(feedback);
        complaint.setStatus(ComplaintStatus.FEEDBACK);
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, ComplaintStatus.RESOLVED, ComplaintStatus.FEEDBACK, citizen,
                "Citizen rated " + request.rating() + "/5"));

        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(Instant.now());
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, ComplaintStatus.FEEDBACK, ComplaintStatus.CLOSED, citizen,
                "Complaint closed after citizen feedback"));

        complaintRepository.save(complaint);
        log.info("Complaint {} feedback submitted and closed by citizen {}",
                complaint.getComplaintNumber(), citizen.getEmail());
        return feedbackMapper.toResponse(feedback);
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackForCitizen(Long citizenId, Long complaintId) {
        if (complaintRepository.findByIdAndCitizenId(complaintId, citizenId).isEmpty()) {
            throw new ResourceNotFoundException("Complaint not found");
        }
        Feedback feedback = feedbackRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
        return feedbackMapper.toResponse(feedback);
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackForAdmin(Long complaintId) {
        if (!complaintRepository.existsById(complaintId)) {
            throw new ResourceNotFoundException("Complaint not found");
        }
        Feedback feedback = feedbackRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
        return feedbackMapper.toResponse(feedback);
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackForOfficer(Long officerId, Long complaintId) {
        if (complaintRepository.findByIdAndOfficerId(complaintId, officerId).isEmpty()) {
            throw new ResourceNotFoundException("Complaint not found");
        }
        Feedback feedback = feedbackRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
        return feedbackMapper.toResponse(feedback);
    }

    @Transactional
    public ComplaintResponse closeByCitizen(Long citizenId, Long complaintId, CloseComplaintRequest request) {
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findDetailedByIdAndCitizenId(complaintId, citizenId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (!CLOSABLE.contains(complaint.getStatus())) {
            throw InvalidStatusTransitionException.of(complaint.getStatus().name(), ComplaintStatus.CLOSED.name());
        }

        ComplaintStatus old = complaint.getStatus();
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(Instant.now());
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, old, ComplaintStatus.CLOSED, citizen,
                defaultRemarks(request == null ? null : request.remarks(), "Citizen closed complaint")));

        log.info("Complaint {} closed by citizen {}", complaint.getComplaintNumber(), citizen.getEmail());
        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintResponse closeByAdmin(Long adminId, Long complaintId, CloseComplaintRequest request) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findDetailedById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (!CLOSABLE.contains(complaint.getStatus())) {
            throw InvalidStatusTransitionException.of(complaint.getStatus().name(), ComplaintStatus.CLOSED.name());
        }

        ComplaintStatus old = complaint.getStatus();
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(Instant.now());
        complaint.addStatusHistory(ComplaintStatusHistory.of(
                complaint, old, ComplaintStatus.CLOSED, admin,
                defaultRemarks(request == null ? null : request.remarks(), "Administratively closed")));

        log.info("Complaint {} administratively closed by admin {}",
                complaint.getComplaintNumber(), admin.getEmail());
        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    private String nextComplaintNumber() {
        String prefix = "CIVIC-" + Year.now() + "-";
        long sequence = complaintRepository.countByComplaintNumberStartingWith(prefix) + 1;
        return prefix + String.format("%06d", sequence);
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultRemarks(String remarks, String fallback) {
        if (remarks == null || remarks.isBlank()) {
            return fallback;
        }
        return remarks.trim();
    }
}
