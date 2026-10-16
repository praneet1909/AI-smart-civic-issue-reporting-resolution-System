package com.aismartcivic.web;

import com.aismartcivic.common.dto.PageResponse;
import com.aismartcivic.domain.enums.ComplaintStatus;
import com.aismartcivic.dto.ComplaintResponse;
import com.aismartcivic.dto.ComplaintSummaryResponse;
import com.aismartcivic.dto.FeedbackResponse;
import com.aismartcivic.dto.ResolveComplaintRequest;
import com.aismartcivic.dto.TimelineEventResponse;
import com.aismartcivic.dto.UpdateOfficerStatusRequest;
import com.aismartcivic.security.AuthenticatedUser;
import com.aismartcivic.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/officer/complaints")
public class OfficerComplaintController {

    private final ComplaintService complaintService;

    public OfficerComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    public PageResponse<ComplaintSummaryResponse> list(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return complaintService.listForOfficer(currentUser.getId(), status, page, size);
    }

    @GetMapping("/{id}")
    public ComplaintResponse get(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return complaintService.getForOfficer(currentUser.getId(), id);
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEventResponse> timeline(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return complaintService.timelineForOfficer(currentUser.getId(), id);
    }

    @PutMapping("/{id}/status")
    public ComplaintResponse updateStatus(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateOfficerStatusRequest request
    ) {
        return complaintService.updateStatusByOfficer(currentUser.getId(), id, request);
    }

    @PutMapping(value = "/{id}/resolve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ComplaintResponse resolve(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @ModelAttribute ResolveComplaintRequest request,
            @RequestParam("afterImage") MultipartFile afterImage
    ) {
        return complaintService.resolveByOfficer(currentUser.getId(), id, request, afterImage);
    }

    @GetMapping("/{id}/feedback")
    public FeedbackResponse getFeedback(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return complaintService.getFeedbackForOfficer(currentUser.getId(), id);
    }
}
