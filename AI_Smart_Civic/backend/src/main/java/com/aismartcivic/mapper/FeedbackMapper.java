package com.aismartcivic.mapper;

import com.aismartcivic.domain.entity.Feedback;
import com.aismartcivic.domain.entity.User;
import com.aismartcivic.dto.FeedbackResponse;
import org.springframework.stereotype.Component;

@Component
public class FeedbackMapper {

    public FeedbackResponse toResponse(Feedback feedback) {
        User citizen = feedback.getCitizen();
        return new FeedbackResponse(
                feedback.getId(),
                feedback.getComplaint().getId(),
                citizen.getId(),
                citizen.getName(),
                feedback.getRating(),
                feedback.getComment(),
                feedback.getCreatedAt()
        );
    }
}
