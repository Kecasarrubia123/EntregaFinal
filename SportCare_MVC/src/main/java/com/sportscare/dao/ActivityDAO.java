package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.ActivityRecord;
import com.sportscare.util.ApiException;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ActivityDAO {
    public List<ActivityRecord> findByUser(int userId) throws SQLException {
        String sql="SELECT s.fecha_sesion,e.nombre,c.nombre AS categoria,COALESCE(se.detalle,e.duracion_texto) AS detalle,e.codigo " +
                "FROM sesiones s JOIN sesion_ejercicios se ON se.sesion_id=s.id JOIN ejercicios e ON e.id=se.ejercicio_id " +
                "JOIN categorias_ejercicio c ON c.id=e.categoria_id WHERE s.usuario_id=? ORDER BY s.fecha_sesion DESC,s.id DESC";
        List<ActivityRecord> list=new ArrayList<>();
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql)){
            ps.setInt(1,userId);try(ResultSet rs=ps.executeQuery()){
                while(rs.next()) list.add(new ActivityRecord(rs.getDate("fecha_sesion").toLocalDate().toString(),rs.getString("nombre"),rs.getString("categoria"),rs.getString("detalle"),rs.getString("codigo")));
            }
        }
        return list;
    }

    public void create(int userId, String exerciseCode, LocalDate date) throws SQLException {
        String lookup="SELECT e.id,e.duracion_texto,e.series FROM ejercicios e WHERE e.codigo=? AND e.activo=1";
        String insertSession="INSERT INTO sesiones (usuario_id,fecha_sesion,observaciones) VALUES (?,?,?)";
        String insertItem="INSERT INTO sesion_ejercicios (sesion_id,ejercicio_id,detalle,series_realizadas) VALUES (?,?,?,?)";
        try(Connection c=Database.getConnection()){
            c.setAutoCommit(false);
            try{
                int exerciseId,series;String detail;
                try(PreparedStatement ps=c.prepareStatement(lookup)){
                    ps.setString(1,exerciseCode);try(ResultSet rs=ps.executeQuery()){
                        if(!rs.next()) throw ApiException.badRequest("Selecciona un ejercicio activo del catálogo.");
                        exerciseId=rs.getInt("id");detail=rs.getString("duracion_texto");series=rs.getInt("series");
                    }
                }
                int sessionId;
                try(PreparedStatement ps=c.prepareStatement(insertSession,Statement.RETURN_GENERATED_KEYS)){
                    ps.setInt(1,userId);ps.setDate(2,Date.valueOf(date));ps.setString(3,"Actividad registrada desde el panel Sports Care.");ps.executeUpdate();
                    try(ResultSet keys=ps.getGeneratedKeys()){if(!keys.next())throw new SQLException("No se pudo crear la sesión.");sessionId=keys.getInt(1);}
                }
                try(PreparedStatement ps=c.prepareStatement(insertItem)){
                    ps.setInt(1,sessionId);ps.setInt(2,exerciseId);ps.setString(3,detail);ps.setInt(4,series);ps.executeUpdate();
                }
                c.commit();
            }catch(Exception ex){c.rollback();if(ex instanceof SQLException sql)throw sql;if(ex instanceof RuntimeException runtime)throw runtime;throw new SQLException(ex);}
            finally{c.setAutoCommit(true);}
        }
    }
}
