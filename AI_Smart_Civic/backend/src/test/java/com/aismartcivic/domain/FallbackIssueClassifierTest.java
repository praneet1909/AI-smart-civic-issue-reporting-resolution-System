package com.aismartcivic.domain;

import com.aismartcivic.domain.enums.IssueType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FallbackIssueClassifierTest {

    @Test
    void classifiesPotholeText() {
        assertThat(FallbackIssueClassifier.classify("Huge pothole", "Bikes cannot pass"))
                .isEqualTo(IssueType.POTHOLES_ROAD_DAMAGE);
    }

    @Test
    void classifiesGarbageText() {
        assertThat(FallbackIssueClassifier.classify("Garbage overflow", "Bins not collected"))
                .isEqualTo(IssueType.GARBAGE_OVERFLOW);
    }
}
