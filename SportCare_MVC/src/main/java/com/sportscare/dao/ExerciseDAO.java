package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.Exercise;
import com.sportscare.util.ApiException;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ExerciseDAO {
    private static final String SELECT = "SELECT e.codigo,e.nombre,c.nombre AS categoria,e.descripcion,e.duracion_texto,e.series,e.nivel,e.imagen_url " +
            "FROM ejercicios e JOIN categorias_ejercicio c ON c.id=e.categoria_id WHERE e.activo=1";

    public List<Exercise> findAllActive() throws SQLException {
        List<Exercise> items = new ArrayList<>();
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement(SELECT + " ORDER BY e.nombre"); ResultSet rs=ps.executeQuery()) {
            while (rs.next()) items.add(toExercise(rs));
        }
        return items;
    }

    public Exercise findActiveByCode(String code) throws SQLException {
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement(SELECT + " AND e.codigo=?")) {
            ps.setString(1, code);
            try (ResultSet rs=ps.executeQuery()) { return rs.next() ? toExercise(rs) : null; }
        }
    }

    public void create(Exercise exercise, int adminId) throws SQLException {
        int categoryId = categoryId(exercise.category());
        String sql = "INSERT INTO ejercicios (codigo,categoria_id,creado_por,nombre,descripcion,duracion_texto,series,nivel,imagen_url,activo) VALUES (?,?,?,?,?,?,?,?,?,1)";
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement(sql)) {
            ps.setString(1, exercise.code()); ps.setInt(2, categoryId); ps.setInt(3, adminId);
            ps.setString(4, exercise.name()); ps.setString(5, exercise.description()); ps.setString(6, exercise.duration());
            ps.setInt(7, exercise.series()); ps.setString(8, exercise.level()); ps.setString(9, emptyToNull(exercise.image()));
            ps.executeUpdate();
        } catch (SQLIntegrityConstraintViolationException ex) { throw ApiException.conflict("Ese código de ejercicio ya existe."); }
    }

    public void update(String code, Exercise exercise) throws SQLException {
        int categoryId = categoryId(exercise.category());
        String sql = "UPDATE ejercicios SET categoria_id=?,nombre=?,descripcion=?,duracion_texto=?,series=?,nivel=?,imagen_url=? WHERE codigo=? AND activo=1";
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement(sql)) {
            ps.setInt(1, categoryId); ps.setString(2, exercise.name()); ps.setString(3, exercise.description());
            ps.setString(4, exercise.duration()); ps.setInt(5, exercise.series()); ps.setString(6, exercise.level());
            ps.setString(7, emptyToNull(exercise.image())); ps.setString(8, code);
            if (ps.executeUpdate()==0) throw ApiException.notFound("No se encontró el ejercicio activo.");
        }
    }

    public void deactivate(String code) throws SQLException {
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement("UPDATE ejercicios SET activo=0 WHERE codigo=? AND activo=1")) {
            ps.setString(1, code);
            if (ps.executeUpdate()==0) throw ApiException.notFound("No se encontró el ejercicio activo.");
        }
    }

    private int categoryId(String category) throws SQLException {
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement("SELECT id FROM categorias_ejercicio WHERE nombre=? AND activa=1")) {
            ps.setString(1, category);
            try (ResultSet rs=ps.executeQuery()) {
                if (!rs.next()) throw ApiException.badRequest("La categoría indicada no existe en categorias_ejercicio.");
                return rs.getInt(1);
            }
        }
    }

    private Exercise toExercise(ResultSet rs) throws SQLException {
        return new Exercise(rs.getString("codigo"),rs.getString("nombre"),rs.getString("categoria"),
                rs.getString("descripcion"),rs.getString("duracion_texto"),rs.getInt("series"),
                rs.getString("nivel"),rs.getString("imagen_url"));
    }
    private String emptyToNull(String value) { return value == null || value.isBlank() ? null : value; }
}
