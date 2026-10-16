package com.aismartcivic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResolveComplaintRequest {

    @NotBlank(message = "Resolution remarks are required")
    @Size(min = 5, max = 2000, message = "Remarks must be between 5 and 2000 characters")
    private String remarks;

    public ResolveComplaintRequest() {
    }

    public ResolveComplaintRequest(String remarks) {
        this.remarks = remarks;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
