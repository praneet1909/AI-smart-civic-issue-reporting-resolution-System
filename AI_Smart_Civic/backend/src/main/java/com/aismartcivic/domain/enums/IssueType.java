package com.aismartcivic.domain.enums;

import com.aismartcivic.domain.IssueCategoryCatalog;

public enum IssueType {
    POTHOLES_ROAD_DAMAGE,
    STREETLIGHT_NOT_WORKING,
    GARBAGE_OVERFLOW,
    WATER_LEAKAGE,
    OPEN_BLOCKED_GUTTER_CHAMBER,
    DRAINAGE_BLOCKAGE,
    RIVER_PLASTIC_WASTE,
    FALLEN_TREE_ROAD_OBSTRUCTION;

    public String defaultDepartmentName() {
        return IssueCategoryCatalog.departmentName(this);
    }

    public Priority defaultPriority() {
        return IssueCategoryCatalog.defaultPriority(this);
    }
}
