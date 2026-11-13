package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.AuthAccount;
import com.sportscare.model.User;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserDAO {
    public AuthAccount findAccountByEmail(String email) throws SQLException {
        String sql = "SELECT u.id,u.nombre,u.correo,u.estado,r.nombre AS rol,u.password_hash " +
                "FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(u.correo)=LOWER(?) LIMIT 1";
        try (Connection c = Database.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new AuthAccount(toUser(rs), rs.getString("password_hash"));
            }
        }
    }

    public User findById(int id) throws SQLException {
        String sql = "SELECT u.id,u.nombre,u.correo,u.estado,r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=?";
        try (Connection c = Database.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? toUser(rs) : null; }
        }
    }

    public User createRegularUser(String name, String email, String passwordHash) throws SQLException {
        return createUser(name, email, passwordHash, "USUARIO");
    }

    public User createAdmin(String name, String email, String passwordHash) throws SQLException {
        return createUser(name, email, passwordHash, "ADMINISTRADOR");
    }

    private User createUser(String name, String email, String passwordHash, String role) throws SQLException {
        String roleSql = "SELECT id FROM roles WHERE nombre=?";
        String insertSql = "INSERT INTO usuarios (rol_id,nombre,correo,password_hash,estado) VALUES (?,?,?,?,'ACTIVO')";
        try (Connection c = Database.getConnection()) {
            c.setAutoCommit(false);
            try {
                int roleId;
                try (PreparedStatement ps = c.prepareStatement(roleSql)) {
                    ps.setString(1, role);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) throw new SQLException("No existe el rol " + role + " en la tabla roles.");
                        roleId = rs.getInt(1);
                    }
                }
                int id;
                try (PreparedStatement ps = c.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, roleId); ps.setString(2, name); ps.setString(3, email); ps.setString(4, passwordHash);
                    ps.executeUpdate();
                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (!keys.next()) throw new SQLException("No se pudo recuperar el identificador del usuario.");
                        id = keys.getInt(1);
                    }
                }
                try (PreparedStatement ps = c.prepareStatement("INSERT INTO perfiles (usuario_id,nombre_visible) VALUES (?,?)")) {
                    ps.setInt(1, id); ps.setString(2, name); ps.executeUpdate();
                }
                c.commit();
                return findById(id);
            } catch (SQLException ex) {
                c.rollback();
                throw ex;
            } finally { c.setAutoCommit(true); }
        }
    }

    public List<User> findAll() throws SQLException {
        String sql = "SELECT u.id,u.nombre,u.correo,u.estado,r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id ORDER BY u.creado_en DESC";
        List<User> result = new ArrayList<>();
        try (Connection c = Database.getConnection(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(toUser(rs));
        }
        return result;
    }

    public void updateName(int id, String name) throws SQLException {
        try (Connection c = Database.getConnection()) {
            c.setAutoCommit(false);
            try (PreparedStatement user = c.prepareStatement("UPDATE usuarios SET nombre=? WHERE id=?");
                 PreparedStatement profile = c.prepareStatement("UPDATE perfiles SET nombre_visible=? WHERE usuario_id=?")) {
                user.setString(1, name); user.setInt(2, id);
                if (user.executeUpdate() == 0) throw new SQLException("Usuario no encontrado.");
                profile.setString(1, name); profile.setInt(2, id); profile.executeUpdate();
                c.commit();
            } catch (SQLException ex) { c.rollback(); throw ex; }
            finally { c.setAutoCommit(true); }
        }
    }

    public void setActive(int id, boolean active) throws SQLException {
        try (Connection c = Database.getConnection(); PreparedStatement ps = c.prepareStatement("UPDATE usuarios SET estado=? WHERE id=?")) {
            ps.setString(1, active ? "ACTIVO" : "INACTIVO"); ps.setInt(2, id);
            if (ps.executeUpdate() == 0) throw new SQLException("Usuario no encontrado.");
        }
    }

    public int countAdmins() throws SQLException {
        String sql = "SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE r.nombre='ADMINISTRADOR'";
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement(sql); ResultSet rs=ps.executeQuery()) { rs.next(); return rs.getInt(1); }
    }

    private User toUser(ResultSet rs) throws SQLException {
        return new User(rs.getInt("id"), rs.getString("nombre"), rs.getString("correo"),
                rs.getString("rol"), "ACTIVO".equalsIgnoreCase(rs.getString("estado")));
    }
}
