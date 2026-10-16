package com.aismartcivic.web;

import com.aismartcivic.common.dto.PageResponse;
import com.aismartcivic.dto.AssignComplaintRequest;
import com.aismartcivic.dto.CloseComplaintRequest;
import com.aismartcivic.dto.ComplaintResponse;
import com.aismartcivic.dto.ComplaintSummaryResponse;
import com.aismartcivic.dto.FeedbackResponse;
import com.aismartcivic.dto.TimelineEventResponse;
import com.aismartcivic.security.AuthenticatedUser;
import com.aismartcivic.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/complaints")
public class AdminComplaintController {

    private final ComplaintService complaintService;

    public AdminComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    public PageResponse<ComplaintSummaryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return complaintService.listAllForAdmin(page, size);
    }

    @GetMapping("/{id}")
    public ComplaintResponse get(@PathVariable Long id) {
        return complaintService.getForAdmin(id);
    }

    @GetMapping("/{id}/timeline")
    public List<TimelineEventResponse> timeline(@PathVariable Long id) {
        return complaintService.timelineForAdmin(id);
    }

    @PutMapping("/{id}/assign")
    public ComplaintResponse assign(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody AssignComplaintRequest request
    ) {
        return complaintService.assign(currentUser.getId(), id, request, false);
    }

    @PutMapping("/{id}/reassign")
    public ComplaintResponse reassign(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody AssignComplaintRequest request
    ) {
        return complaintService.assign(currentUser.getId(), id, request, true);
    }

    @GetMapping("/{id}/feedback")
    public FeedbackResponse getFeedback(@PathVariable Long id) {
        return complaintService.getFeedbackForAdmin(id);
    }

    @PutMapping("/{id}/close")
    public ComplaintResponse close(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CloseComplaintRequest request
    ) {
        return complaintService.closeByAdmin(currentUser.getId(), id, request);
    }
}
