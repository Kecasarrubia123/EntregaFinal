package com.sportscare.service;

import com.sportscare.model.User;
import com.sun.net.httpserver.HttpExchange;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class SessionManager {
    private static final String COOKIE_NAME = "SPORTSCARE_SESSION";
    private static final long SESSION_SECONDS = 12 * 60 * 60;
    private final Map<String, SessionEntry> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public void start(HttpExchange exchange, User user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(token, new SessionEntry(user, Instant.now().plusSeconds(SESSION_SECONDS).getEpochSecond()));
        String cookie = COOKIE_NAME + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + SESSION_SECONDS;
        exchange.getResponseHeaders().add("Set-Cookie", cookie);
    }

    public User currentUser(HttpExchange exchange) {
        String token = cookieValue(exchange, COOKIE_NAME);
        if (token == null) return null;
        SessionEntry entry = sessions.get(token);
        if (entry == null) return null;
        if (entry.expiresAt() < Instant.now().getEpochSecond()) {
            sessions.remove(token);
            return null;
        }
        return entry.user();
    }

    public void refreshUser(HttpExchange exchange, User user) {
        String token = cookieValue(exchange, COOKIE_NAME);
        if (token == null) return;
        SessionEntry entry = sessions.get(token);
        if (entry != null) sessions.put(token, new SessionEntry(user, entry.expiresAt()));
    }

    public void end(HttpExchange exchange) {
        String token = cookieValue(exchange, COOKIE_NAME);
        if (token != null) sessions.remove(token);
        exchange.getResponseHeaders().add("Set-Cookie", COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    }

    private String cookieValue(HttpExchange exchange, String name) {
        String header = exchange.getRequestHeaders().getFirst("Cookie");
        if (header == null) return null;
        for (String part : header.split(";")) {
            String[] pair = part.trim().split("=", 2);
            if (pair.length == 2 && pair[0].equals(name)) return pair[1];
        }
        return null;
    }

    private record SessionEntry(User user, long expiresAt) {}
}
