package com.sportscare.model;

import java.math.BigDecimal;

public record PlanRecord(String code, String name, String description,
                         BigDecimal price, String period) {}
