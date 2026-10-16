package com.aismartcivic.domain;

import com.aismartcivic.domain.enums.IssueType;

public final class FallbackIssueClassifier {

    private FallbackIssueClassifier() {
    }

    public static IssueType classify(String title, String description) {
        String text = ((title == null ? "" : title) + " " + (description == null ? "" : description)).toLowerCase();
        if (containsAny(text, "pothole", "road damage", "crater", "asphalt")) {
            return IssueType.POTHOLES_ROAD_DAMAGE;
        }
        if (containsAny(text, "streetlight", "street light", "lamp", "electric pole")) {
            return IssueType.STREETLIGHT_NOT_WORKING;
        }
        if (containsAny(text, "garbage", "trash", "waste bin", "overflow")) {
            return IssueType.GARBAGE_OVERFLOW;
        }
        if (containsAny(text, "water leak", "pipe burst", "water supply")) {
            return IssueType.WATER_LEAKAGE;
        }
        if (containsAny(text, "gutter", "manhole", "chamber")) {
            return IssueType.OPEN_BLOCKED_GUTTER_CHAMBER;
        }
        if (containsAny(text, "drain", "drainage", "storm water")) {
            return IssueType.DRAINAGE_BLOCKAGE;
        }
        if (containsAny(text, "river", "plastic waste", "nallah")) {
            return IssueType.RIVER_PLASTIC_WASTE;
        }
        if (containsAny(text, "fallen tree", "tree", "obstruction", "debris")) {
            return IssueType.FALLEN_TREE_ROAD_OBSTRUCTION;
        }
        return IssueType.POTHOLES_ROAD_DAMAGE;
    }

    private static boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
