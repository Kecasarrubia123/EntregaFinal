package com.sportscare.service;

import org.mindrot.jbcrypt.BCrypt;

public final class PasswordService {
    private PasswordService() {}
    public static String hash(String password) { return BCrypt.hashpw(password, BCrypt.gensalt(12)); }
    public static boolean verify(String password, String hash) {
        try { return BCrypt.checkpw(password, hash); }
        catch (IllegalArgumentException ex) { return false; }
    }
}
