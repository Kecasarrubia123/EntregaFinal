package com.sportscare.controller;

import com.sportscare.dao.ExerciseDAO;
import com.sportscare.model.Exercise;
import com.sportscare.model.User;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class ExerciseController extends ControllerSupport {
    private final ExerciseDAO dao;public ExerciseController(ExerciseDAO dao){this.dao=dao;}
    public List<Exercise> list()throws SQLException{return dao.findAllActive();}
    public Exercise get(String code)throws SQLException{Exercise e=dao.findActiveByCode(code);if(e==null)throw ApiException.notFound("No se encontró el ejercicio.");return e;}
    public Map<String,Object> create(User user,Map<String,Object> body)throws SQLException{
        User admin=requireAdmin(user);Exercise e=fromBody(body);dao.create(e,admin.id());return ApiUtil.map("message","Ejercicio registrado.");
    }
    public Map<String,Object> update(User user,String code,Map<String,Object> body)throws SQLException{
        requireAdmin(user);dao.update(code,fromBody(body));return ApiUtil.map("message","Ejercicio actualizado.");
    }
    public Map<String,Object> delete(User user,String code)throws SQLException{
        requireAdmin(user);dao.deactivate(code);return ApiUtil.map("message","Ejercicio desactivado. Se conserva el historial asociado.");
    }
    private Exercise fromBody(Map<String,Object> b){
        String code=ApiUtil.text(b,"code").toUpperCase(),name=ApiUtil.text(b,"name"),category=ApiUtil.text(b,"category"),description=ApiUtil.text(b,"description"),duration=ApiUtil.text(b,"duration"),level=ApiUtil.text(b,"level"),image=ApiUtil.text(b,"image");
        Integer series=ApiUtil.integer(b,"series");
        if(code.isBlank()||name.isBlank()||category.isBlank()||description.isBlank()||duration.isBlank()||level.isBlank()||series==null)throw ApiException.badRequest("Completa los campos obligatorios del ejercicio.");
        if(series<1||series>10)throw ApiException.badRequest("El número de series debe estar entre 1 y 10.");
        if(image.length()>500)throw ApiException.badRequest("La ruta de imagen es demasiado larga.");
        return new Exercise(code,name,category,description,duration,series,level,image);
    }
}
