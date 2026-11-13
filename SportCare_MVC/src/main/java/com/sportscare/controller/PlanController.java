package com.sportscare.controller;

import com.sportscare.dao.PlanDAO;
import com.sportscare.model.PlanRecord;
import com.sportscare.model.User;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class PlanController extends ControllerSupport {
    private final PlanDAO dao;public PlanController(PlanDAO dao){this.dao=dao;}
    public List<PlanRecord> list()throws SQLException{return dao.findActive();}
    public Map<String,Object> createInterest(User current,Map<String,Object> body)throws SQLException{
        String code=ApiUtil.text(body,"planCode").toUpperCase();
        if("DEMO".equals(code))return ApiUtil.map("message","Plan de demostración seleccionado.");
        if(!List.of("INDIVIDUAL","INSTITUCIONAL").contains(code))throw ApiException.badRequest("El plan seleccionado no existe.");
        String name=current==null?ApiUtil.text(body,"name"):current.name();String email=current==null?ApiUtil.text(body,"email"):current.email();
        if(name.isBlank()||!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))throw ApiException.badRequest("Para registrar el interés, escribe tu nombre y un correo válido.");
        Map<String,Object> record=dao.createInterest(code,current==null?null:current.id(),name,email);
        return ApiUtil.map("message","Interés registrado.","interest",record);
    }
    public List<Map<String,Object>> adminList(User user)throws SQLException{requireAdmin(user);return dao.findAllInterests();}
    public Map<String,Object> updateStatus(User user,int id,Map<String,Object> body)throws SQLException{
        requireAdmin(user);String status=ApiUtil.text(body,"status");
        if(!List.of("Interés registrado","Contactado (demo)","Cerrado (demo)").contains(status))throw ApiException.badRequest("Estado de interés no permitido.");
        dao.updateStatus(id,status);return ApiUtil.map("message","Estado del interés actualizado.");
    }
}
