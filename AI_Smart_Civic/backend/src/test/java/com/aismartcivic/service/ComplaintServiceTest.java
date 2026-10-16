package com.aismartcivic.service;

import com.aismartcivic.ai.AiClassificationResult;
import com.aismartcivic.ai.AiIssueClassifier;
import com.aismartcivic.common.exception.ForbiddenOperationException;
import com.aismartcivic.common.exception.InvalidStatusTransitionException;
import com.aismartcivic.common.exception.ResourceNotFoundException;
import com.aismartcivic.domain.entity.Complaint;
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
import com.aismartcivic.dto.CreateComplaintRequest;
import com.aismartcivic.dto.CreateFeedbackRequest;
import com.aismartcivic.dto.FeedbackResponse;
import com.aismartcivic.dto.ResolveComplaintRequest;
import com.aismartcivic.dto.UpdateOfficerStatusRequest;
import com.aismartcivic.mapper.ComplaintMapper;
import com.aismartcivic.mapper.FeedbackMapper;
import com.aismartcivic.repository.ComplaintRepository;
import com.aismartcivic.repository.ComplaintStatusHistoryRepository;
import com.aismartcivic.repository.DepartmentRepository;
import com.aismartcivic.repository.FeedbackRepository;
import com.aismartcivic.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;
    @Mock
    private ComplaintStatusHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private AiIssueClassifier aiIssueClassifier;

    private ComplaintService complaintService;

    @BeforeEach
    void setUp() {
        FileStorageService files = new FileStorageService() {
            @Override
            public String store(String folder, org.springframework.web.multipart.MultipartFile file) {
                return folder + "/stored.jpg";
            }

            @Override
            public byte[] load(String relativePath) {
                return new byte[] {1};
            }
        };
        complaintService = new ComplaintService(
                complaintRepository, historyRepository, userRepository,
                departmentRepository, feedbackRepository, files,
                new ComplaintMapper(), new FeedbackMapper(), aiIssueClassifier);
    }

    @Test
    void createPersistsOwnedComplaintWithFallbackClassification() {
        User citizen = user(3L, Role.CITIZEN, null);
        Department roads = department();
        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(aiIssueClassifier.classify(any(), any(), any())).thenReturn(
                AiClassificationResult.fallback(IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, "Fallback classification"));
        when(departmentRepository.findByName("Road Maintenance")).thenReturn(Optional.of(roads));
        when(complaintRepository.countByComplaintNumberStartingWith(any())).thenReturn(0L);
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateComplaintRequest request = new CreateComplaintRequest();
        request.setTitle("Huge pothole near main road");
        request.setDescription("Dangerous at night");
        request.setLocationAddress("MG Road");

        ComplaintResponse response = complaintService.create(3L, request, image());

        assertThat(response.complaintNumber()).startsWith("CIVIC-");
        assertThat(response.status()).isEqualTo(ComplaintStatus.AI_VERIFIED);
        assertThat(response.citizenId()).isEqualTo(3L);
        assertThat(response.departmentName()).isEqualTo("Road Maintenance");
        assertThat(response.beforeImageUrl()).isEqualTo("/api/files/before/stored.jpg");
        assertThat(response.aiProcessingStatus()).isEqualTo(AiProcessingStatus.FALLBACK);
    }

    @Test
    void createPersistsOwnedComplaintWithAiClassification() {
        User citizen = user(3L, Role.CITIZEN, null);
        Department water = new Department("Water Supply Department", "Water");
        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(aiIssueClassifier.classify(any(), any(), any())).thenReturn(
                AiClassificationResult.success(IssueType.WATER_LEAKAGE, Priority.HIGH, 0.95, "Major main pipeline burst detected"));
        when(departmentRepository.findByName("Water Supply Department")).thenReturn(Optional.of(water));
        when(complaintRepository.countByComplaintNumberStartingWith(any())).thenReturn(0L);
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateComplaintRequest request = new CreateComplaintRequest();
        request.setTitle("Broken pipe flooding street");
        request.setDescription("Clean drinking water leaking rapidly");
        request.setLocationAddress("Station Road");

        ComplaintResponse response = complaintService.create(3L, request, image());

        assertThat(response.issueType()).isEqualTo(IssueType.WATER_LEAKAGE);
        assertThat(response.status()).isEqualTo(ComplaintStatus.AI_VERIFIED);
        assertThat(response.aiProcessingStatus()).isEqualTo(AiProcessingStatus.SUCCESS);
        assertThat(response.aiConfidence()).isEqualTo(0.95);
        assertThat(response.aiSummary()).isEqualTo("Major main pipeline burst detected");
        assertThat(response.departmentName()).isEqualTo("Water Supply Department");
    }

    @Test
    void citizenCannotAccessAnotherComplaint() {
        when(complaintRepository.findDetailedByIdAndCitizenId(9L, 3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> complaintService.getMine(3L, 9L))
                .isInstanceOf(com.aismartcivic.common.exception.ResourceNotFoundException.class);
    }

    @Test
    void assignMovesAiVerifiedToPending() {
        User admin = user(1L, Role.ADMIN, null);
        User officer = user(8L, Role.OFFICER, department());
        Complaint complaint = new Complaint();
        complaint.setComplaintNumber("CIVIC-2026-000001");
        complaint.setTitle("Pothole");
        complaint.setDescription("Hole");
        complaint.setStatus(ComplaintStatus.AI_VERIFIED);
        complaint.setCitizen(user(3L, Role.CITIZEN, null));
        complaint.setDepartment(department());
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.findById(8L)).thenReturn(Optional.of(officer));
        when(complaintRepository.findDetailedById(5L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ComplaintResponse response = complaintService.assign(1L, 5L, new AssignComplaintRequest(8L, "Take this"), false);

        assertThat(response.status()).isEqualTo(ComplaintStatus.PENDING);
        assertThat(response.officerId()).isEqualTo(8L);
    }

    @Test
    void assignRejectsInvalidStatus() {
        User admin = user(1L, Role.ADMIN, null);
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.REPORTED);
        complaint.setCitizen(user(3L, Role.CITIZEN, null));
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(complaintRepository.findDetailedById(5L)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() -> complaintService.assign(1L, 5L, new AssignComplaintRequest(8L, null), false))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void assignRejectsNonOfficer() {
        User admin = user(1L, Role.ADMIN, null);
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.AI_VERIFIED);
        complaint.setCitizen(citizen);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(complaintRepository.findDetailedById(5L)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() -> complaintService.assign(1L, 5L, new AssignComplaintRequest(3L, null), false))
                .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void timelineForAdminReturnsEventsWhenComplaintExists() {
        when(complaintRepository.existsById(10L)).thenReturn(true);
        when(historyRepository.findByComplaintIdOrderByChangedAtAsc(10L)).thenReturn(java.util.List.of());

        var result = complaintService.timelineForAdmin(10L);
        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void timelineForAdminThrowsNotFoundWhenComplaintDoesNotExist() {
        when(complaintRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> complaintService.timelineForAdmin(99L))
                .isInstanceOf(com.aismartcivic.common.exception.ResourceNotFoundException.class);
    }

    @Test
    void listAllForAdminUsesDetailedQuery() {
        when(complaintRepository.findAllDetailed(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        var page = complaintService.listAllForAdmin(0, 10);
        assertThat(page.content()).isEmpty();
    }

    @Test
    void listForOfficerReturnsComplaints() {
        when(complaintRepository.findByOfficerId(any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));
        when(complaintRepository.findByOfficerIdAndStatus(any(), any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        var allAssigned = complaintService.listForOfficer(8L, null, 0, 10);
        var pendingOnly = complaintService.listForOfficer(8L, ComplaintStatus.PENDING, 0, 10);

        assertThat(allAssigned.content()).isEmpty();
        assertThat(pendingOnly.content()).isEmpty();
    }

    @Test
    void getForOfficerReturnsDetailsWhenAssigned() {
        Complaint complaint = new Complaint();
        complaint.setComplaintNumber("CIVIC-2026-000001");
        complaint.setTitle("Broken streetlight");
        complaint.setDescription("Dark street");
        complaint.setStatus(ComplaintStatus.PENDING);
        complaint.setCitizen(user(3L, Role.CITIZEN, null));
        complaint.setOfficer(user(8L, Role.OFFICER, department()));
        complaint.setDepartment(department());

        when(complaintRepository.findDetailedByIdAndOfficerId(1L, 8L)).thenReturn(Optional.of(complaint));

        ComplaintResponse response = complaintService.getForOfficer(8L, 1L);
        assertThat(response.complaintNumber()).isEqualTo("CIVIC-2026-000001");
        assertThat(response.officerId()).isEqualTo(8L);
    }

    @Test
    void getForOfficerThrowsNotFoundWhenNotAssigned() {
        when(complaintRepository.findDetailedByIdAndOfficerId(1L, 8L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.getForOfficer(8L, 1L))
                .isInstanceOf(com.aismartcivic.common.exception.ResourceNotFoundException.class);
    }

    @Test
    void timelineForOfficerReturnsEvents() {
        when(complaintRepository.findByIdAndOfficerId(1L, 8L)).thenReturn(Optional.of(new Complaint()));
        when(historyRepository.findByComplaintIdOrderByChangedAtAsc(1L)).thenReturn(java.util.List.of());

        var timeline = complaintService.timelineForOfficer(8L, 1L);
        assertThat(timeline).isNotNull().isEmpty();
    }

    @Test
    void updateStatusByOfficerTransitionsPendingToInProgress() {
        User officer = user(8L, Role.OFFICER, department());
        Complaint complaint = new Complaint();
        complaint.setComplaintNumber("CIVIC-2026-000001");
        complaint.setTitle("Broken streetlight");
        complaint.setDescription("Dark street");
        complaint.setStatus(ComplaintStatus.PENDING);
        complaint.setCitizen(user(3L, Role.CITIZEN, null));
        complaint.setOfficer(officer);
        complaint.setDepartment(department());

        when(userRepository.findById(8L)).thenReturn(Optional.of(officer));
        when(complaintRepository.findDetailedByIdAndOfficerId(1L, 8L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        ComplaintResponse response = complaintService.updateStatusByOfficer(
                8L, 1L, new UpdateOfficerStatusRequest(ComplaintStatus.IN_PROGRESS, "Started work"));

        assertThat(response.status()).isEqualTo(ComplaintStatus.IN_PROGRESS);
    }

    @Test
    void updateStatusByOfficerThrowsOnInvalidStatus() {
        User officer = user(8L, Role.OFFICER, department());
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.RESOLVED);

        when(userRepository.findById(8L)).thenReturn(Optional.of(officer));
        when(complaintRepository.findDetailedByIdAndOfficerId(1L, 8L)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() -> complaintService.updateStatusByOfficer(
                8L, 1L, new UpdateOfficerStatusRequest(ComplaintStatus.IN_PROGRESS, null)))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void resolveByOfficerSucceeds() {
        User officer = user(8L, Role.OFFICER, department());
        Complaint complaint = new Complaint();
        complaint.setComplaintNumber("CIVIC-2026-000001");
        complaint.setTitle("Broken streetlight");
        complaint.setDescription("Dark street");
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaint.setCitizen(user(3L, Role.CITIZEN, null));
        complaint.setOfficer(officer);
        complaint.setDepartment(department());

        when(userRepository.findById(8L)).thenReturn(Optional.of(officer));
        when(complaintRepository.findDetailedByIdAndOfficerId(1L, 8L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        ComplaintResponse response = complaintService.resolveByOfficer(
                8L, 1L, new ResolveComplaintRequest("Replaced burnt LED bulb"), image());

        assertThat(response.status()).isEqualTo(ComplaintStatus.RESOLVED);
        assertThat(response.officerRemarks()).isEqualTo("Replaced burnt LED bulb");
        assertThat(response.afterImageUrl()).isEqualTo("/api/files/after/stored.jpg");
        assertThat(response.resolvedAt()).isNotNull();
    }

    @Test
    void resolveByOfficerThrowsWhenNotInProgress() {
        User officer = user(8L, Role.OFFICER, department());
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.PENDING);

        when(userRepository.findById(8L)).thenReturn(Optional.of(officer));
        when(complaintRepository.findDetailedByIdAndOfficerId(1L, 8L)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() -> complaintService.resolveByOfficer(
                8L, 1L, new ResolveComplaintRequest("Replaced burnt LED bulb"), image()))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void resolveByOfficerThrowsWhenImageMissing() {
        assertThatThrownBy(() -> complaintService.resolveByOfficer(
                8L, 1L, new ResolveComplaintRequest("Replaced burnt LED bulb"), null))
                .isInstanceOf(com.aismartcivic.common.exception.InvalidFileException.class);
    }

    @Test
    void submitFeedbackSucceeds() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.RESOLVED, citizen);

        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(complaintRepository.findDetailedByIdAndCitizenId(1L, 3L)).thenReturn(Optional.of(complaint));
        when(feedbackRepository.existsByComplaintId(1L)).thenReturn(false);
        when(feedbackRepository.save(any(Feedback.class))).thenAnswer(inv -> {
            Feedback f = inv.getArgument(0);
            try {
                var field = Feedback.class.getDeclaredField("id");
                field.setAccessible(true);
                field.set(f, 100L);
                var createdField = Feedback.class.getDeclaredField("createdAt");
                createdField.setAccessible(true);
                createdField.set(f, java.time.Instant.now());
            } catch (ReflectiveOperationException ex) {
                throw new IllegalStateException(ex);
            }
            return f;
        });
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        FeedbackResponse response = complaintService.submitFeedback(3L, 1L,
                new CreateFeedbackRequest(4, "Good job fixing the pothole"));

        assertThat(response.rating()).isEqualTo(4);
        assertThat(response.comment()).isEqualTo("Good job fixing the pothole");
        assertThat(complaint.getStatus()).isEqualTo(ComplaintStatus.CLOSED);
        assertThat(complaint.getClosedAt()).isNotNull();
    }

    @Test
    void submitFeedbackThrowsWhenNotResolved() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.IN_PROGRESS, citizen);

        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(complaintRepository.findDetailedByIdAndCitizenId(1L, 3L)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() -> complaintService.submitFeedback(3L, 1L,
                new CreateFeedbackRequest(5, "Great")))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void submitFeedbackThrowsWhenDuplicate() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.RESOLVED, citizen);

        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(complaintRepository.findDetailedByIdAndCitizenId(1L, 3L)).thenReturn(Optional.of(complaint));
        when(feedbackRepository.existsByComplaintId(1L)).thenReturn(true);

        assertThatThrownBy(() -> complaintService.submitFeedback(3L, 1L,
                new CreateFeedbackRequest(5, "Again")))
                .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void closeByCitizenSucceeds() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.RESOLVED, citizen);

        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(complaintRepository.findDetailedByIdAndCitizenId(1L, 3L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        ComplaintResponse response = complaintService.closeByCitizen(3L, 1L,
                new CloseComplaintRequest("Satisfied"));

        assertThat(response.status()).isEqualTo(ComplaintStatus.CLOSED);
        assertThat(response.closedAt()).isNotNull();
    }

    @Test
    void closeByCitizenThrowsWhenNotClosable() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.PENDING, citizen);

        when(userRepository.findById(3L)).thenReturn(Optional.of(citizen));
        when(complaintRepository.findDetailedByIdAndCitizenId(1L, 3L)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() -> complaintService.closeByCitizen(3L, 1L, null))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void closeByAdminSucceeds() {
        User admin = user(1L, Role.ADMIN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.RESOLVED, user(3L, Role.CITIZEN, null));

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(complaintRepository.findDetailedById(1L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));

        ComplaintResponse response = complaintService.closeByAdmin(1L, 1L,
                new CloseComplaintRequest("Grace period elapsed"));

        assertThat(response.status()).isEqualTo(ComplaintStatus.CLOSED);
        assertThat(response.closedAt()).isNotNull();
    }

    @Test
    void getFeedbackForCitizenSucceeds() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.CLOSED, citizen);
        Feedback fb = feedback(complaint, citizen, 5, "Great work");

        when(complaintRepository.findByIdAndCitizenId(1L, 3L)).thenReturn(Optional.of(complaint));
        when(feedbackRepository.findByComplaintId(1L)).thenReturn(Optional.of(fb));

        FeedbackResponse response = complaintService.getFeedbackForCitizen(3L, 1L);

        assertThat(response.rating()).isEqualTo(5);
        assertThat(response.comment()).isEqualTo("Great work");
        assertThat(response.citizenId()).isEqualTo(3L);
    }

    @Test
    void getFeedbackForCitizenThrowsWhenComplaintNotFound() {
        when(complaintRepository.findByIdAndCitizenId(1L, 3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.getFeedbackForCitizen(3L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getFeedbackForCitizenThrowsWhenFeedbackNotFound() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.CLOSED, citizen);

        when(complaintRepository.findByIdAndCitizenId(1L, 3L)).thenReturn(Optional.of(complaint));
        when(feedbackRepository.findByComplaintId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.getFeedbackForCitizen(3L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getFeedbackForAdminSucceeds() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.CLOSED, citizen);
        Feedback fb = feedback(complaint, citizen, 4, "Good job");

        when(complaintRepository.existsById(1L)).thenReturn(true);
        when(feedbackRepository.findByComplaintId(1L)).thenReturn(Optional.of(fb));

        FeedbackResponse response = complaintService.getFeedbackForAdmin(1L);

        assertThat(response.rating()).isEqualTo(4);
        assertThat(response.citizenName()).isEqualTo(citizen.getName());
    }

    @Test
    void getFeedbackForAdminThrowsWhenComplaintNotFound() {
        when(complaintRepository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> complaintService.getFeedbackForAdmin(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getFeedbackForOfficerSucceeds() {
        User citizen = user(3L, Role.CITIZEN, null);
        Complaint complaint = complaintWithStatus(ComplaintStatus.CLOSED, citizen);
        Feedback fb = feedback(complaint, citizen, 5, "Superb");

        when(complaintRepository.findByIdAndOfficerId(1L, 8L)).thenReturn(Optional.of(complaint));
        when(feedbackRepository.findByComplaintId(1L)).thenReturn(Optional.of(fb));

        FeedbackResponse response = complaintService.getFeedbackForOfficer(8L, 1L);

        assertThat(response.rating()).isEqualTo(5);
        assertThat(response.comment()).isEqualTo("Superb");
    }

    @Test
    void getFeedbackForOfficerThrowsWhenComplaintNotFound() {
        when(complaintRepository.findByIdAndOfficerId(1L, 8L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.getFeedbackForOfficer(8L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private Feedback feedback(Complaint complaint, User citizen, int rating, String comment) {
        Feedback f = new Feedback();
        f.setComplaint(complaint);
        f.setCitizen(citizen);
        f.setRating(rating);
        f.setComment(comment);
        try {
            var field = Feedback.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(f, 50L);
            var createdField = Feedback.class.getDeclaredField("createdAt");
            createdField.setAccessible(true);
            createdField.set(f, java.time.Instant.now());
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
        return f;
    }

    private Complaint complaintWithStatus(ComplaintStatus status, User citizen) {
        Complaint complaint = new Complaint();
        complaint.setComplaintNumber("CIVIC-2026-000001");
        complaint.setTitle("Pothole");
        complaint.setDescription("Hole");
        complaint.setStatus(status);
        complaint.setCitizen(citizen);
        complaint.setDepartment(department());
        try {
            var field = Complaint.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(complaint, 1L);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
        return complaint;
    }

    private MockMultipartFile image() {
        return new MockMultipartFile("beforeImage", "a.jpg", "image/jpeg", new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1});
    }

    private Department department() {
        return new Department("Road Maintenance", "Roads");
    }

    private User user(Long id, Role role, Department department) {
        User user = new User();
        user.setName(role.name());
        user.setEmail(role.name().toLowerCase() + id + "@example.com");
        user.setPassword("hash");
        user.setRole(role);
        user.setEnabled(true);
        user.setDepartment(department);
        try {
            var field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
        return user;
    }
}
