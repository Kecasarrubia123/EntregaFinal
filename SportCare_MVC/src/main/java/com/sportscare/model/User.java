package com.sportscare.model;

public record User(int id, String name, String email, String role, boolean active) {
    public boolean isAdmin() {
        return "ADMINISTRADOR".equalsIgnoreCase(role);
    }
}
