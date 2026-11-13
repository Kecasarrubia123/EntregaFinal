package com.sportscare.model;

import java.math.BigDecimal;

public record Questionnaire(String goal, String experience, int days,
                             Integer age, BigDecimal height, BigDecimal weight) {}
