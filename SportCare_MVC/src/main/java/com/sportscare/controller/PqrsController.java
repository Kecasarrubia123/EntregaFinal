package com.sportscare.controller;

import com.sportscare.dao.PqrsDAO;
import com.sportscare.model.PqrsTicket;
import com.sportscare.model.User;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class PqrsController extends ControllerSupport {
    private final PqrsDAO dao;public PqrsController(PqrsDAO dao){this.dao=dao;}
    public PqrsTicket create(User current,Map<String,Object> body)throws SQLException{
        String name=ApiUtil.text(body,"name"),email=ApiUtil.text(body,"email").toLowerCase(Locale.ROOT),type=ApiUtil.text(body,"type"),area=ApiUtil.text(body,"area"),subject=ApiUtil.text(body,"subject"),message=ApiUtil.text(body,"message");
        if(name.isBlank()||!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")||type.isBlank()||area.isBlank()||subject.isBlank()||message.length()<10)throw ApiException.badRequest("Completa todos los campos. La descripción debe tener al menos 10 caracteres.");
        if(name.length()>120||email.length()>150||subject.length()>120||message.length()>1500)throw ApiException.badRequest("Uno de los campos supera la longitud permitida.");
        return dao.create(current==null?null:current.id(),name,email,type,area,subject,message);
    }
    public List<Map<String,Object>> lookup(String email)throws SQLException{
        String clean=email==null?"":email.trim().toLowerCase(Locale.ROOT);if(!clean.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))throw ApiException.badRequest("Escribe un correo electrónico válido para consultar.");
        // La consulta pública solo expone el resumen necesario para seguimiento; no devuelve el mensaje original ni los datos completos del contacto.
        return dao.findByEmail(clean).stream().map(ticket -> ApiUtil.map(
                "id",ticket.id(),"createdAt",ticket.createdAt(),"type",ticket.type(),
                "subject",ticket.subject(),"status",ticket.status(),"response",ticket.response())).toList();
    }
    public List<PqrsTicket> adminList(User user)throws SQLException{requireAdmin(user);return dao.findAll();}
    public Map<String,Object> updateStatus(User user,String code,Map<String,Object> body)throws SQLException{
        requireAdmin(user);String status=ApiUtil.text(body,"status");if(!List.of("Recibida","En revisión","Respondida","Cerrada").contains(status))throw ApiException.badRequest("Estado PQRS no permitido.");
        dao.updateStatus(code,status);return ApiUtil.map("message","Estado PQRS actualizado.");
    }
    public Map<String,Object> updateResponse(User user,String code,Map<String,Object> body)throws SQLException{
        User admin=requireAdmin(user);String response=ApiUtil.text(body,"response");if(response.length()>5000)throw ApiException.badRequest("La respuesta es demasiado larga.");
        dao.updateResponse(code,response,admin.id());return ApiUtil.map("message","Respuesta guardada.");
    }
}
