package com.sportscare.controller;

import com.sportscare.dao.UserDAO;
import com.sportscare.model.User;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class UserController extends ControllerSupport {
    private final UserDAO dao;public UserController(UserDAO dao){this.dao=dao;}
    public List<User> list(User user)throws SQLException{requireAdmin(user);return dao.findAll();}
    public Map<String,Object> updateName(User user,int id,Map<String,Object> body)throws SQLException{
        requireAdmin(user);String name=ApiUtil.text(body,"name");if(name.isBlank())throw ApiException.badRequest("El nombre no puede quedar vacío.");
        dao.updateName(id,name);return ApiUtil.map("message","Nombre actualizado.");
    }
    public Map<String,Object> updateStatus(User user,int id,Map<String,Object> body)throws SQLException{
        User admin=requireAdmin(user);if(admin.id()==id)throw ApiException.badRequest("No puedes desactivar tu propia cuenta de administrador.");
        Object value=body.get("active");if(!(value instanceof Boolean active))throw ApiException.badRequest("El estado debe ser verdadero o falso.");
        User target=dao.findById(id);if(target==null)throw ApiException.notFound("No se encontró el usuario.");
        if(target.isAdmin())throw ApiException.badRequest("Esta pantalla no permite cambiar el estado de cuentas administradoras.");
        dao.setActive(id,active);return ApiUtil.map("message","Estado de usuario actualizado.");
    }
}
