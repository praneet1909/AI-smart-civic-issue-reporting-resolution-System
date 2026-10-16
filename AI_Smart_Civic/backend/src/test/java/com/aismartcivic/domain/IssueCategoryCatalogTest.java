package com.aismartcivic.domain;

import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IssueCategoryCatalogTest {

    @Test
    void coversExactlyEightCivicCategories() {
        assertThat(IssueCategoryCatalog.all()).hasSize(8);
        assertThat(IssueType.values()).hasSize(8);
    }

    @Test
    void mapsPotholesToRoadMaintenanceHigh() {
        assertThat(IssueType.POTHOLES_ROAD_DAMAGE.defaultDepartmentName()).isEqualTo("Road Maintenance");
        assertThat(IssueType.POTHOLES_ROAD_DAMAGE.defaultPriority()).isEqualTo(Priority.HIGH);
    }

    @Test
    void mapsStreetlightToElectricalMedium() {
        assertThat(IssueType.STREETLIGHT_NOT_WORKING.defaultDepartmentName()).isEqualTo("Electrical Department");
        assertThat(IssueType.STREETLIGHT_NOT_WORKING.defaultPriority()).isEqualTo(Priority.MEDIUM);
    }
}
