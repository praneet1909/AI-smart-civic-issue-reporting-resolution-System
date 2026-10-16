package com.aismartcivic.web;

import com.aismartcivic.common.dto.PageResponse;
import com.aismartcivic.common.exception.GlobalExceptionHandler;
import com.aismartcivic.domain.enums.AiProcessingStatus;
import com.aismartcivic.domain.enums.ComplaintStatus;
import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.dto.CloseComplaintRequest;
import com.aismartcivic.dto.ComplaintResponse;
import com.aismartcivic.dto.ComplaintSummaryResponse;
import com.aismartcivic.dto.CreateFeedbackRequest;
import com.aismartcivic.dto.FeedbackResponse;
import com.aismartcivic.dto.TimelineEventResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CitizenComplaintControllerTest {

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
                return new AuthenticatedUser(5L, "citizen@example.com", "pass", Role.CITIZEN, true);
            }
        };

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new CitizenComplaintController(complaintService))
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void createComplaintReturnsCreated() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
                "beforeImage", "pothole.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[] {1, 2, 3});

        ComplaintResponse response = new ComplaintResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St", "Big hole",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.AI_VERIFIED,
                18.5204, 73.8567, "Main St", "/api/files/before/pothole.jpg", null,
                "Auto classified", null, AiProcessingStatus.FALLBACK, null,
                Instant.now(), null, null, null, 5L, "Citizen", 1L, "Roads", null, null
        );

        when(complaintService.create(eq(5L), any(), any())).thenReturn(response);

        mockMvc.perform(multipart("/api/complaints")
                        .file(image)
                        .param("title", "Pothole on Main St")
                        .param("description", "Big hole")
                        .param("locationAddress", "Main St"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.complaintNumber").value("CIVIC-2026-000001"))
                .andExpect(jsonPath("$.status").value("AI_VERIFIED"))
                .andExpect(jsonPath("$.citizenId").value(5));
    }

    @Test
    void createComplaintValidationFailsWhenTitleMissing() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
                "beforeImage", "pothole.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/complaints")
                        .file(image)
                        .param("description", "Big hole"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void myComplaintsReturnsPaginatedList() throws Exception {
        ComplaintSummaryResponse summary = new ComplaintSummaryResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.AI_VERIFIED,
                "Roads", Instant.now()
        );
        PageResponse<ComplaintSummaryResponse> pageResponse = PageResponse.from(
                new PageImpl<>(List.of(summary), PageRequest.of(0, 10), 1),
                s -> s
        );

        when(complaintService.listMine(5L, 0, 10)).thenReturn(pageResponse);

        mockMvc.perform(get("/api/complaints/my?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].complaintNumber").value("CIVIC-2026-000001"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getComplaintReturnsDetails() throws Exception {
        ComplaintResponse response = new ComplaintResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St", "Big hole",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.AI_VERIFIED,
                18.5204, 73.8567, "Main St", "/api/files/before/pothole.jpg", null,
                "Auto classified", null, AiProcessingStatus.FALLBACK, null,
                Instant.now(), null, null, null, 5L, "Citizen", 1L, "Roads", null, null
        );

        when(complaintService.getMine(5L, 1L)).thenReturn(response);

        mockMvc.perform(get("/api/complaints/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complaintNumber").value("CIVIC-2026-000001"));
    }

    @Test
    void timelineReturnsEvents() throws Exception {
        TimelineEventResponse event = new TimelineEventResponse(
                ComplaintStatus.REPORTED, ComplaintStatus.AI_VERIFIED, "Citizen", "Issue submitted", Instant.now()
        );

        when(complaintService.timelineMine(5L, 1L)).thenReturn(List.of(event));

        mockMvc.perform(get("/api/complaints/1/timeline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].newStatus").value("AI_VERIFIED"));
    }

    @Test
    void submitFeedbackReturnsCreated() throws Exception {
        FeedbackResponse response = new FeedbackResponse(
                10L, 1L, 5L, "Citizen", 5, "Excellent resolution", Instant.now()
        );

        when(complaintService.submitFeedback(eq(5L), eq(1L), any(CreateFeedbackRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/complaints/1/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 5,
                                  "comment": "Excellent resolution"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Excellent resolution"));
    }

    @Test
    void submitFeedbackValidationFailsWhenRatingInvalid() throws Exception {
        mockMvc.perform(post("/api/complaints/1/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 6,
                                  "comment": "Invalid rating"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getFeedbackReturnsFeedbackResponse() throws Exception {
        FeedbackResponse response = new FeedbackResponse(
                10L, 1L, 5L, "Citizen", 4, "Good job", Instant.now()
        );

        when(complaintService.getFeedbackForCitizen(5L, 1L)).thenReturn(response);

        mockMvc.perform(get("/api/complaints/1/feedback"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.rating").value(4));
    }

    @Test
    void closeComplaintSucceeds() throws Exception {
        ComplaintResponse response = new ComplaintResponse(
                1L, "CIVIC-2026-000001", "Pothole on Main St", "Big hole",
                IssueType.POTHOLES_ROAD_DAMAGE, Priority.HIGH, ComplaintStatus.CLOSED,
                18.5204, 73.8567, "Main St", "/api/files/before/pothole.jpg", "/api/files/after/fixed.jpg",
                "Auto classified", null, AiProcessingStatus.FALLBACK, "Fixed",
                Instant.now(), Instant.now(), Instant.now(), Instant.now(), 5L, "Citizen", 1L, "Roads", null, null
        );

        when(complaintService.closeByCitizen(eq(5L), eq(1L), any())).thenReturn(response);

        mockMvc.perform(put("/api/complaints/1/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remarks\":\"Happy with repair\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }
}
