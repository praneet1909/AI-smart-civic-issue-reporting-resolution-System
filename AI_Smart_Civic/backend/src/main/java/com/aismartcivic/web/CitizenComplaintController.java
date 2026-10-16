package com.aismartcivic.web;

import com.aismartcivic.common.dto.PageResponse;
import com.aismartcivic.dto.CloseComplaintRequest;
import com.aismartcivic.dto.ComplaintResponse;
import com.aismartcivic.dto.ComplaintSummaryResponse;
import com.aismartcivic.dto.CreateComplaintRequest;
import com.aismartcivic.dto.CreateFeedbackRequest;
import com.aismartcivic.dto.FeedbackResponse;
import com.aismartcivic.dto.TimelineEventResponse;
import com.aismartcivic.security.AuthenticatedUser;
import com.aismartcivic.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class CitizenComplaintController {

    private final ComplaintService complaintService;

    public CitizenComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ComplaintResponse> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @ModelAttribute CreateComplaintRequest request,
            @RequestParam("beforeImage") MultipartFile beforeImage
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(complaintService.create(currentUser.getId(), request, beforeImage));
    }

    @GetMapping("/my")
    public PageResponse<ComplaintSummaryResponse> myComplaints(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return complaintService.listMine(currentUser.getId(), page, size);
    }

    @GetMapping("/{id}")
    public ComplaintResponse get(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return complaintService.getMine(currentUser.getId(), id);
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEventResponse> timeline(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return complaintService.timelineMine(currentUser.getId(), id);
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody CreateFeedbackRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(complaintService.submitFeedback(currentUser.getId(), id, request));
    }

    @GetMapping("/{id}/feedback")
    public FeedbackResponse getFeedback(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return complaintService.getFeedbackForCitizen(currentUser.getId(), id);
    }

    @PutMapping("/{id}/close")
    public ComplaintResponse close(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CloseComplaintRequest request
    ) {
        return complaintService.closeByCitizen(currentUser.getId(), id, request);
    }
}
