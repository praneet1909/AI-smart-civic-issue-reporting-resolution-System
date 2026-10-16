package com.aismartcivic.domain;

import com.aismartcivic.domain.enums.IssueType;
import com.aismartcivic.domain.enums.Priority;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Controlled mapping of the eight civic categories to municipal departments.
 * AI output is validated against this catalog; it is not stored as free text.
 */
public final class IssueCategoryCatalog {

    public record CategoryDefinition(IssueType issueType, String departmentName, String departmentDescription,
                                     Priority defaultPriority) {
    }

    private static final List<CategoryDefinition> DEFINITIONS = List.of(
            new CategoryDefinition(IssueType.POTHOLES_ROAD_DAMAGE, "Road Maintenance",
                    "Repairs potholes, road surface damage, and related carriageway hazards.", Priority.HIGH),
            new CategoryDefinition(IssueType.STREETLIGHT_NOT_WORKING, "Electrical Department",
                    "Maintains street lighting and related electrical civic infrastructure.", Priority.MEDIUM),
            new CategoryDefinition(IssueType.GARBAGE_OVERFLOW, "Sanitation Department",
                    "Handles garbage collection, overflow, and sanitation complaints.", Priority.MEDIUM),
            new CategoryDefinition(IssueType.WATER_LEAKAGE, "Water Supply Department",
                    "Responds to water leakage and water-supply infrastructure faults.", Priority.HIGH),
            new CategoryDefinition(IssueType.OPEN_BLOCKED_GUTTER_CHAMBER, "Sewerage Department",
                    "Maintains gutter chambers, manholes, and sewerage access points.", Priority.HIGH),
            new CategoryDefinition(IssueType.DRAINAGE_BLOCKAGE, "Drainage Department",
                    "Clears drainage blockages and related storm-water issues.", Priority.HIGH),
            new CategoryDefinition(IssueType.RIVER_PLASTIC_WASTE, "Environment Department",
                    "Addresses river pollution, plastic waste, and environmental hazards.", Priority.HIGH),
            new CategoryDefinition(IssueType.FALLEN_TREE_ROAD_OBSTRUCTION, "Parks & Disaster Management",
                    "Clears fallen trees and road obstructions; coordinates disaster response.", Priority.HIGH)
    );

    private static final Map<IssueType, CategoryDefinition> BY_TYPE = new EnumMap<>(IssueType.class);

    static {
        for (CategoryDefinition definition : DEFINITIONS) {
            BY_TYPE.put(definition.issueType(), definition);
        }
    }

    private IssueCategoryCatalog() {
    }

    public static List<CategoryDefinition> all() {
        return DEFINITIONS;
    }

    public static String departmentName(IssueType issueType) {
        return definition(issueType).departmentName();
    }

    public static Priority defaultPriority(IssueType issueType) {
        return definition(issueType).defaultPriority();
    }

    public static CategoryDefinition definition(IssueType issueType) {
        CategoryDefinition definition = BY_TYPE.get(issueType);
        if (definition == null) {
            throw new IllegalArgumentException("Unsupported issue type: " + issueType);
        }
        return definition;
    }
}
