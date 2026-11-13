package com.sportscare.util;

public class ApiException extends RuntimeException {
    private final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int status() { return status; }

    public static ApiException badRequest(String message) { return new ApiException(400, message); }
    public static ApiException unauthorized() { return new ApiException(401, "Debes iniciar sesión para continuar."); }
    public static ApiException forbidden() { return new ApiException(403, "No tienes permisos para realizar esta operación."); }
    public static ApiException notFound(String message) { return new ApiException(404, message); }
    public static ApiException conflict(String message) { return new ApiException(409, message); }
}
