package com.sportscare.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

public final class ApiUtil {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private ApiUtil() {}

    public static Map<String, Object> readMap(byte[] bytes) {
        try {
            if (bytes == null || bytes.length == 0) return new LinkedHashMap<>();
            return MAPPER.readValue(bytes, new TypeReference<>() {});
        } catch (Exception ex) {
            throw ApiException.badRequest("El cuerpo enviado no contiene JSON válido.");
        }
    }

    public static String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    public static Integer integer(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) return null;
        try { return new BigDecimal(String.valueOf(value)).intValueExact(); }
        catch (Exception ex) { throw ApiException.badRequest("El campo " + key + " debe ser un número entero."); }
    }

    public static BigDecimal decimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) return null;
        try { return new BigDecimal(String.valueOf(value)); }
        catch (Exception ex) { throw ApiException.badRequest("El campo " + key + " debe ser numérico."); }
    }

    public static Map<String, Object> map(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put(String.valueOf(pairs[i]), pairs[i + 1]);
        return result;
    }
}
