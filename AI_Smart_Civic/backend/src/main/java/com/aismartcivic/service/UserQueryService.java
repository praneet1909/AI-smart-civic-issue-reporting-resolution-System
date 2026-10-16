package com.aismartcivic.service;

import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.dto.UserResponse;
import com.aismartcivic.mapper.UserMapper;
import com.aismartcivic.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserQueryService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserQueryService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listOfficers() {
        return userRepository.findByRole(Role.OFFICER).stream().map(userMapper::toResponse).toList();
    }
}
