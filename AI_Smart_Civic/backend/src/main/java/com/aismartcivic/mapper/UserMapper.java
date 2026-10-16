package com.aismartcivic.mapper;

import com.aismartcivic.domain.entity.Department;
import com.aismartcivic.domain.entity.User;
import com.aismartcivic.dto.UserResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        Department department = user.getDepartment();
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEnabled(),
                department == null ? null : department.getId(),
                department == null ? null : department.getName(),
                user.getCreatedAt()
        );
    }
}
