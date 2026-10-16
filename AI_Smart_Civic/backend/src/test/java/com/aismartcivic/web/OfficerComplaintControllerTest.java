package com.aismartcivic.web;

import com.aismartcivic.common.dto.PageResponse;
import com.aismartcivic.common.exception.GlobalExceptionHandler;
import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.ComplaintStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.dto.ComplaintResponse;
import com.aismartcivic.dto.ComplaintSummaryResponse;
import com.aismartcivic.dto.FeedbackResponse;
import com.aismartcivic.dto.TimelineEventResponse;
import com.aismartcivic.dto.UpdateOfficerStatusRequest;
import com.aismartcivic.security.AuthenticatedUser;
import com.aismartcivic.service.ComplaintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OfficerComplaintControllerTest {

    @Mock
    private ComplaintService complaintService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new AuthenticatedUser(8L, "officer@example.com", "pass", Role.OFFICER, true);
            }
        };

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new OfficerComplaintController(complaintService))
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void listReturnsPaginatedComplaints() throws Exception {
        ComplaintSummaryResponse summary = new ComplaintSummaryResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.PENDING,
                "Roads", Instant.now()
        );
        PageResponse<ComplaintSummaryResponse> pageResponse = PageResponse.from(
                new PageImpl<>(List.of(summary), PageRequest.of(0, 10), 1),
                s -> s
        );

        when(complaintService.listForOfficer(8L, null, 0, 10)).thenReturn(pageResponse);

        mockMvc.perform(get("/api/officer/complaints?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].complaintNumber").value("CIVIC-2026-000001"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listWithStatusFilterReturnsComplaints() throws Exception {
        ComplaintSummaryResponse summary = new ComplaintSummaryResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.PENDING,
                "Roads", Instant.now()
        );
        PageResponse<ComplaintSummaryResponse> pageResponse = PageResponse.from(
                new PageImpl<>(List.of(summary), PageRequest.of(0, 10), 1),
                s -> s
        );

        when(complaintService.listForOfficer(8L, ComplaintStatus.PENDING, 0, 10)).thenReturn(pageResponse);

        mockMvc.perform(get("/api/officer/complaints?status=PENDING&page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }

    @Test
    void getReturnsComplaintDetails() throws Exception {
        ComplaintResponse response = new ComplaintResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St", "Big hole",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.PENDING,
                18.5204, 73.8567, "Main St", "/api/files/before/pothole.jpg", null,
                "Auto classified", null, AiProcessingStatus.FALLBACK, null,
                Instant.now(), Instant.now(), null, null, 5L, "Citizen", 1L, "Roads", 8L, "Officer"
        );

        when(complaintService.getForOfficer(8L, 1L)).thenReturn(response);

        mockMvc.perform(get("/api/officer/complaints/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complaintNumber").value("CIVIC-2026-000001"))
                .andExpect(jsonPath("$.officerId").value(8));
    }

    @Test
    void timelineReturnsEvents() throws Exception {
        TimelineEventResponse event = new TimelineEventResponse(
                ComplaintStatus.ASSIGNED, ComplaintStatus.PENDING, "Admin", "Assigned", Instant.now()
        );

        when(complaintService.timelineForOfficer(8L, 1L)).thenReturn(List.of(event));

        mockMvc.perform(get("/api/officer/complaints/1/timeline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].newStatus").value("PENDING"));
    }

    @Test
    void updateStatusToInProgressSucceeds() throws Exception {
        ComplaintResponse response = new ComplaintResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St", "Big hole",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.IN_PROGRESS,
                18.5204, 73.8567, "Main St", "/api/files/before/pothole.jpg", null,
                "Auto classified", null, AiProcessingStatus.FALLBACK, null,
                Instant.now(), Instant.now(), null, null, 5L, "Citizen", 1L, "Roads", 8L, "Officer"
        );

        when(complaintService.updateStatusByOfficer(eq(8L), eq(1L), any(UpdateOfficerStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/officer/complaints/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\",\"remarks\":\"Field team on the way\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void updateStatusValidationFailsWhenStatusMissing() throws Exception {
        mockMvc.perform(put("/api/officer/complaints/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remarks\":\"Starting work\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void resolveComplaintWithMultipartSucceeds() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
                "afterImage", "fixed.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[] {1, 2, 3});

        ComplaintResponse response = new ComplaintResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St", "Big hole",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.RESOLVED,
                18.5204, 73.8567, "Main St", "/api/files/before/pothole.jpg", "/api/files/after/fixed.jpg",
                "Auto classified", null, AiProcessingStatus.FALLBACK, "Pothole asphalt filled and compacted",
                Instant.now(), Instant.now(), Instant.now(), null, 5L, "Citizen", 1L, "Roads", 8L, "Officer"
        );

        when(complaintService.resolveByOfficer(eq(8L), eq(1L), any(), any())).thenReturn(response);

        MockMultipartHttpServletRequestBuilder builder = multipart("/api/officer/complaints/1/resolve");
        builder.with(request -> {
            request.setMethod("PUT");
            return request;
        });

        mockMvc.perform(builder
                        .file(image)
                        .param("remarks", "Pothole asphalt filled and compacted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.afterImageUrl").value("/api/files/after/fixed.jpg"))
                .andExpect(jsonPath("$.officerRemarks").value("Pothole asphalt filled and compacted"));
    }

    @Test
    void resolveComplaintFailsWhenRemarksBlank() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
                "afterImage", "fixed.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[] {1, 2, 3});

        MockMultipartHttpServletRequestBuilder builder = multipart("/api/officer/complaints/1/resolve");
        builder.with(request -> {
            request.setMethod("PUT");
            return request;
        });

        mockMvc.perform(builder
                        .file(image)
                        .param("remarks", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getFeedbackReturnsFeedbackResponse() throws Exception {
        FeedbackResponse response = new FeedbackResponse(
                10L, 1L, 5L, "Citizen", 5, "Great work", Instant.now()
        );

        when(complaintService.getFeedbackForOfficer(8L, 1L)).thenReturn(response);

        mockMvc.perform(get("/api/officer/complaints/1/feedback"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.citizenName").value("Citizen"));
    }
}
