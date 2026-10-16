package com.aismartcivic.web;

import com.aismartcivic.dto.UserResponse;
import com.aismartcivic.service.UserQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/officers")
public class AdminOfficerController {

    private final UserQueryService userQueryService;

    public AdminOfficerController(UserQueryService userQueryService) {
        this.userQueryService = userQueryService;
    }

    @GetMapping
    public List<UserResponse> list() {
        return userQueryService.listOfficers();
    }
}
