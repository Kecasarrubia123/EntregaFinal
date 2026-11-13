package com.sportscare.config;

public final class AppConfig {
    private AppConfig() {}

    public static int port() {
        return Integer.parseInt(value("SPORTSCARE_PORT", "server.port", "7070"));
    }

    public static String webRoot() {
        return value("SPORTSCARE_WEB_ROOT", "web.root", "SPT");
    }

    public static String dbUrl() {
        return value("SPORTSCARE_DB_URL", "db.url", "jdbc:mariadb://localhost:3306/sports_care?useUnicode=true&characterEncoding=utf8");
    }

    public static String dbUser() {
        return value("SPORTSCARE_DB_USER", "db.user", "root");
    }

    public static String dbPassword() {
        return value("SPORTSCARE_DB_PASSWORD", "db.password", "");
    }

    private static String value(String env, String property, String fallback) {
        String fromEnv = System.getenv(env);
        if (fromEnv != null) return fromEnv;
        String fromSystem = System.getProperty(property);
        if (fromSystem != null) return fromSystem;
        java.util.Properties properties = new java.util.Properties();
        try (java.io.InputStream input = AppConfig.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (input != null) properties.load(input);
        } catch (java.io.IOException ignored) { }
        return properties.getProperty(property, fallback);
    }
}
