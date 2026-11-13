package com.sportscare.model;

public record PqrsTicket(String id, String createdAt, String name, String email,
                         String type, String area, String subject, String message,
                         String status, String response) {}
