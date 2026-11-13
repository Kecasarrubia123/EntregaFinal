package com.sportscare.controller;

import com.sportscare.dao.ActivityDAO;
import com.sportscare.dao.QuestionnaireDAO;
import com.sportscare.model.ActivityRecord;
import com.sportscare.model.Questionnaire;
import com.sportscare.model.User;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class DashboardController extends ControllerSupport {
    private final QuestionnaireDAO questionnaires;private final ActivityDAO activities;
    public DashboardController(QuestionnaireDAO q,ActivityDAO a){questionnaires=q;activities=a;}
    public Questionnaire getQuestionnaire(User user)throws SQLException{return questionnaires.findByUser(requireRegularUser(user).id());}
    public Map<String,Object> saveQuestionnaire(User user,Map<String,Object> body)throws SQLException{
        requireRegularUser(user);
        String goal=ApiUtil.text(body,"goal"),experience=ApiUtil.text(body,"experience");Integer days=ApiUtil.integer(body,"days"),age=ApiUtil.integer(body,"age");
        BigDecimal height=ApiUtil.decimal(body,"height"),weight=ApiUtil.decimal(body,"weight");
        if(goal.isBlank()||experience.isBlank()||days==null||days<1||days>7)throw ApiException.badRequest("Completa el objetivo, nivel de experiencia y días disponibles (1 a 7).");
        if(age!=null&&(age<10||age>100))throw ApiException.badRequest("La edad registrada está fuera del rango permitido por el formulario.");
        if(height!=null&&(height.compareTo(new BigDecimal("80"))<0||height.compareTo(new BigDecimal("250"))>0))throw ApiException.badRequest("La estatura debe estar entre 80 y 250 cm.");
        if(weight!=null&&(weight.compareTo(new BigDecimal("20"))<0||weight.compareTo(new BigDecimal("350"))>0))throw ApiException.badRequest("El peso debe estar entre 20 y 350 kg.");
        questionnaires.save(user.id(),new Questionnaire(goal,experience,days,age,height,weight));return ApiUtil.map("message","Cuestionario guardado en la base de datos.");
    }
    public List<ActivityRecord> activities(User user)throws SQLException{return activities.findByUser(requireRegularUser(user).id());}
    public Map<String,Object> createActivity(User user,Map<String,Object> body)throws SQLException{
        User account=requireRegularUser(user);String code=ApiUtil.text(body,"exerciseCode");String dateText=ApiUtil.text(body,"date");
        if(code.isBlank()||dateText.isBlank())throw ApiException.badRequest("Selecciona un ejercicio y una fecha.");
        LocalDate date;try{date=LocalDate.parse(dateText);}catch(Exception ex){throw ApiException.badRequest("La fecha de la actividad no es válida.");}
        if(date.isAfter(LocalDate.now()))throw ApiException.badRequest("La fecha no puede estar en el futuro.");
        activities.create(account.id(),code,date);return ApiUtil.map("message","Actividad guardada en la base de datos.");
    }
}
