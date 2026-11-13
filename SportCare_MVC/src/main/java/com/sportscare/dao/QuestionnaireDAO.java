package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.Questionnaire;

import java.math.BigDecimal;
import java.sql.*;

public class QuestionnaireDAO {
    public Questionnaire findByUser(int userId) throws SQLException {
        String sql="SELECT objetivo_general,nivel_experiencia,dias_disponibles,edad,estatura_cm,peso_kg FROM cuestionarios_iniciales WHERE usuario_id=?";
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement(sql)) {
            ps.setInt(1,userId);
            try (ResultSet rs=ps.executeQuery()) {
                if (!rs.next()) return null;
                Object rawAge=rs.getObject(4);
                Integer age=rawAge==null?null:((Number)rawAge).intValue();
                return new Questionnaire(rs.getString(1),rs.getString(2),rs.getInt(3),
                        age,rs.getBigDecimal(5),rs.getBigDecimal(6));
            }
        }
    }

    public void save(int userId, Questionnaire q) throws SQLException {
        String sql="INSERT INTO cuestionarios_iniciales (usuario_id,objetivo_general,nivel_experiencia,dias_disponibles,edad,estatura_cm,peso_kg) VALUES (?,?,?,?,?,?,?) " +
                "ON DUPLICATE KEY UPDATE objetivo_general=VALUES(objetivo_general),nivel_experiencia=VALUES(nivel_experiencia),dias_disponibles=VALUES(dias_disponibles),edad=VALUES(edad),estatura_cm=VALUES(estatura_cm),peso_kg=VALUES(peso_kg)";
        try (Connection c=Database.getConnection(); PreparedStatement ps=c.prepareStatement(sql)) {
            ps.setInt(1,userId); ps.setString(2,q.goal()); ps.setString(3,q.experience()); ps.setInt(4,q.days());
            if (q.age()==null) ps.setNull(5,Types.TINYINT); else ps.setInt(5,q.age());
            if (q.height()==null) ps.setNull(6,Types.DECIMAL); else ps.setBigDecimal(6,q.height());
            if (q.weight()==null) ps.setNull(7,Types.DECIMAL); else ps.setBigDecimal(7,q.weight());
            ps.executeUpdate();
        }
    }
}
