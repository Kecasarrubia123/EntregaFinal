package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.PqrsTicket;
import com.sportscare.util.ApiException;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public class PqrsDAO {
    public PqrsTicket create(Integer userId,String name,String email,String type,String area,String subject,String message)throws SQLException{
        String code="SC-"+java.time.Year.now()+"-"+UUID.randomUUID().toString().replace("-","").substring(0,5).toUpperCase(Locale.ROOT);
        String sql="INSERT INTO pqrs(codigo_seguimiento,usuario_id,tipo,tema,asunto,nombre_contacto,correo_contacto,descripcion,estado) VALUES(?,?,?,?,?,?,?,?,'Recibida')";
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql)){
            ps.setString(1,code);if(userId==null)ps.setNull(2,Types.INTEGER);else ps.setInt(2,userId);
            ps.setString(3,type);ps.setString(4,area);ps.setString(5,subject);ps.setString(6,name);ps.setString(7,email);ps.setString(8,message);ps.executeUpdate();
        }
        return findByCode(code);
    }
    public List<PqrsTicket> findByEmail(String email)throws SQLException{
        List<PqrsTicket> list=new ArrayList<>();
        String sql="SELECT codigo_seguimiento,creado_en,nombre_contacto,correo_contacto,tipo,tema,asunto,descripcion,estado,respuesta_admin FROM pqrs WHERE LOWER(correo_contacto)=LOWER(?) ORDER BY creado_en DESC";
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql)){
            ps.setString(1,email);try(ResultSet rs=ps.executeQuery()){while(rs.next())list.add(toTicket(rs));}
        }return list;
    }
    public List<PqrsTicket> findAll()throws SQLException{
        List<PqrsTicket> list=new ArrayList<>();
        String sql="SELECT codigo_seguimiento,creado_en,nombre_contacto,correo_contacto,tipo,tema,asunto,descripcion,estado,respuesta_admin FROM pqrs ORDER BY creado_en DESC";
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql);ResultSet rs=ps.executeQuery()){
            while(rs.next())list.add(toTicket(rs));
        }
        return list;
    }
    public void updateStatus(String code,String status)throws SQLException{
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement("UPDATE pqrs SET estado=? WHERE codigo_seguimiento=?")){
            ps.setString(1,status);ps.setString(2,code);if(ps.executeUpdate()==0)throw ApiException.notFound("No se encontró la solicitud PQRS.");
        }
    }
    public void updateResponse(String code,String response,int adminId)throws SQLException{
        String state=response.isBlank()?"En revisión":"Respondida";
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement("UPDATE pqrs SET respuesta_admin=?,respondida_por=?,estado=? WHERE codigo_seguimiento=?")){
            ps.setString(1,response.isBlank()?null:response);ps.setInt(2,adminId);ps.setString(3,state);ps.setString(4,code);
            if(ps.executeUpdate()==0)throw ApiException.notFound("No se encontró la solicitud PQRS.");
        }
    }
    private PqrsTicket findByCode(String code)throws SQLException{
        String sql="SELECT codigo_seguimiento,creado_en,nombre_contacto,correo_contacto,tipo,tema,asunto,descripcion,estado,respuesta_admin FROM pqrs WHERE codigo_seguimiento=?";
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql)){ps.setString(1,code);try(ResultSet rs=ps.executeQuery()){return rs.next()?toTicket(rs):null;}}
    }
    private PqrsTicket toTicket(ResultSet rs)throws SQLException{
        Timestamp created=rs.getTimestamp("creado_en");
        return new PqrsTicket(rs.getString("codigo_seguimiento"),created==null?null:created.toLocalDateTime().toString(),rs.getString("nombre_contacto"),
                rs.getString("correo_contacto"),rs.getString("tipo"),rs.getString("tema"),rs.getString("asunto"),rs.getString("descripcion"),rs.getString("estado"),rs.getString("respuesta_admin"));
    }
}
