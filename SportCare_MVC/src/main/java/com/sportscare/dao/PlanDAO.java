package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.PlanRecord;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PlanDAO {
    public List<PlanRecord> findActive()throws SQLException{
        List<PlanRecord> list=new ArrayList<>();
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement("SELECT codigo,nombre,descripcion,precio_referencia,periodo FROM planes WHERE activo=1 ORDER BY id");ResultSet rs=ps.executeQuery()){
            while(rs.next())list.add(new PlanRecord(rs.getString(1),rs.getString(2),rs.getString(3),rs.getBigDecimal(4),rs.getString(5)));
        }return list;
    }
    public Map<String,Object> createInterest(String planCode,Integer userId,String name,String email)throws SQLException{
        String sql="INSERT INTO intereses_planes(plan_id,usuario_id,nombre_contacto,correo_contacto) SELECT id,?,?,? FROM planes WHERE codigo=? AND activo=1";
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS)){
            if(userId==null)ps.setNull(1,Types.INTEGER);else ps.setInt(1,userId);ps.setString(2,name);ps.setString(3,email);ps.setString(4,planCode);
            if(ps.executeUpdate()==0)throw ApiException.badRequest("El plan seleccionado no existe o no está activo.");
            try(ResultSet keys=ps.getGeneratedKeys()){
                if(!keys.next())throw new SQLException("No se pudo guardar el interés del plan.");
                return interestById(keys.getInt(1));
            }
        }
    }
    public List<Map<String,Object>> findAllInterests()throws SQLException{
        String sql="SELECT i.id,i.creado_en,p.nombre,p.precio_referencia,p.periodo,i.nombre_contacto,i.correo_contacto,i.estado FROM intereses_planes i JOIN planes p ON p.id=i.plan_id ORDER BY i.creado_en DESC";
        List<Map<String,Object>> list=new ArrayList<>();
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql);ResultSet rs=ps.executeQuery()){
            while(rs.next())list.add(row(rs));
        }return list;
    }
    public void updateStatus(int id,String status)throws SQLException{
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement("UPDATE intereses_planes SET estado=? WHERE id=?")){
            ps.setString(1,status);ps.setInt(2,id);if(ps.executeUpdate()==0)throw ApiException.notFound("No se encontró el interés del plan.");
        }
    }
    private Map<String,Object> interestById(int id)throws SQLException{
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement("SELECT i.id,i.creado_en,p.nombre,p.precio_referencia,p.periodo,i.nombre_contacto,i.correo_contacto,i.estado FROM intereses_planes i JOIN planes p ON p.id=i.plan_id WHERE i.id=?")){
            ps.setInt(1,id);try(ResultSet rs=ps.executeQuery()){return rs.next()?row(rs):null;}
        }
    }
    private Map<String,Object> row(ResultSet rs)throws SQLException{
        String period=rs.getString("periodo");String unit="MES".equalsIgnoreCase(period)?"COP/mes":"COP";
        return ApiUtil.map("id",rs.getInt("id"),"selectedAt",rs.getTimestamp("creado_en").toLocalDateTime().toString(),"name",rs.getString("nombre"),
                "email",rs.getString("correo_contacto"),"contactName",rs.getString("nombre_contacto"),"price",rs.getBigDecimal("precio_referencia"),"unit",unit,"adminStatus",rs.getString("estado"));
    }
}
