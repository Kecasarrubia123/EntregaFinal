package com.sportscare.model;

public record Exercise(String code, String name, String category, String description,
                       String duration, int series, String level, String image) {}
