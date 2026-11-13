package com.sportscare.util;

import com.sportscare.controller.*;
import com.sportscare.model.User;
import com.sportscare.service.SessionManager;
import com.sun.net.httpserver.HttpExchange;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class ApiRouter {
    private final AuthController auth;private final ExerciseController exercises;private final UserController users;
    private final DashboardController dashboard;private final StoreController store;private final PlanController plans;private final PqrsController pqrs;
    private final SessionManager sessions;
    private final com.sportscare.dao.UserDAO userDAO;

    public ApiRouter(AuthController auth,ExerciseController exercises,UserController users,DashboardController dashboard,
                     StoreController store,PlanController plans,PqrsController pqrs,SessionManager sessions,
                     com.sportscare.dao.UserDAO userDAO){
        this.auth=auth;this.exercises=exercises;this.users=users;this.dashboard=dashboard;this.store=store;this.plans=plans;this.pqrs=pqrs;this.sessions=sessions;this.userDAO=userDAO;
    }

    public Object dispatch(HttpExchange exchange)throws Exception{
        String method=exchange.getRequestMethod().toUpperCase();String path=exchange.getRequestURI().getPath();
        Map<String,Object> body=ApiUtil.readMap(exchange.getRequestBody().readAllBytes());
        User user=sessions.currentUser(exchange);
        if (user != null) {
            User freshUser = userDAO.findById(user.id());
            if (freshUser == null || !freshUser.active()) {
                sessions.end(exchange);
                user = null;
            } else {
                user = freshUser;
                sessions.refreshUser(exchange, freshUser);
            }
        }
        if(path.equals("/api/health")&&method.equals("GET"))return ApiUtil.map("status","ok","database","connected");
        if(path.equals("/api/auth/register")&&method.equals("POST"))return auth.register(exchange,body);
        if(path.equals("/api/auth/login")&&method.equals("POST"))return auth.login(exchange,body);
        if(path.equals("/api/auth/me")&&method.equals("GET"))return auth.me(user);
        if(path.equals("/api/auth/logout")&&method.equals("POST"))return auth.logout(exchange);

        if(path.equals("/api/exercises")){
            if(method.equals("GET"))return exercises.list();
            if(method.equals("POST"))return exercises.create(user,body);
        }
        if(path.startsWith("/api/exercises/")){
            String code=segment(path,3);
            if(method.equals("GET"))return exercises.get(code);
            if(method.equals("PUT"))return exercises.update(user,code,body);
            if(method.equals("DELETE"))return exercises.delete(user,code);
        }
        if(path.equals("/api/users")&&method.equals("GET"))return users.list(user);
        if(path.startsWith("/api/users/")){
            String[] s=segments(path);int id=parseId(s,2);
            if(s.length==4&&s[3].equals("name")&&method.equals("PUT"))return users.updateName(user,id,body);
            if(s.length==4&&s[3].equals("status")&&method.equals("PUT"))return users.updateStatus(user,id,body);
        }
        if(path.equals("/api/dashboard/questionnaire")){
            if(method.equals("GET"))return dashboard.getQuestionnaire(user);
            if(method.equals("PUT"))return dashboard.saveQuestionnaire(user,body);
        }
        if(path.equals("/api/dashboard/activities")){
            if(method.equals("GET"))return dashboard.activities(user);
            if(method.equals("POST"))return dashboard.createActivity(user,body);
        }
        if(path.equals("/api/products")&&method.equals("GET"))return store.products();
        if(path.equals("/api/orders")&&method.equals("POST"))return store.createOrder(user,body);
        if(path.equals("/api/admin/orders")&&method.equals("GET"))return store.adminOrders(user);
        if(path.startsWith("/api/admin/orders/")){
            String[] s=segments(path);String code=decode(s[3]);if(s.length==5&&s[4].equals("status")&&method.equals("PUT"))return store.updateOrder(user,code,body);
        }
        if(path.equals("/api/plans")&&method.equals("GET"))return plans.list();
        if(path.equals("/api/plan-interests")&&method.equals("POST"))return plans.createInterest(user,body);
        if(path.equals("/api/admin/plan-interests")&&method.equals("GET"))return plans.adminList(user);
        if(path.startsWith("/api/admin/plan-interests/")){
            String[] s=segments(path);int id=parseId(s,3);if(s.length==5&&s[4].equals("status")&&method.equals("PUT"))return plans.updateStatus(user,id,body);
        }
        if(path.equals("/api/pqrs")){
            if(method.equals("POST"))return pqrs.create(user,body);
            if(method.equals("GET"))return pqrs.lookup(query(exchange,"email"));
        }
        if(path.equals("/api/admin/pqrs")&&method.equals("GET"))return pqrs.adminList(user);
        if(path.startsWith("/api/admin/pqrs/")){
            String[] s=segments(path);String code=decode(s[3]);
            if(s.length==5&&s[4].equals("status")&&method.equals("PUT"))return pqrs.updateStatus(user,code,body);
            if(s.length==5&&s[4].equals("response")&&method.equals("PUT"))return pqrs.updateResponse(user,code,body);
        }
        throw ApiException.notFound("Ruta de API no encontrada.");
    }

    private String query(HttpExchange ex,String key){
        String query=ex.getRequestURI().getRawQuery();if(query==null)return "";
        for(String part:query.split("&")){String[] pair=part.split("=",2);if(decode(pair[0]).equals(key))return pair.length==2?decode(pair[1]):"";}return "";
    }
    private String[] segments(String path){return Arrays.stream(path.split("/")).filter(v->!v.isBlank()).toArray(String[]::new);}
    private String segment(String path,int index){String[] s=segments(path);if(s.length<=index-1)throw ApiException.notFound("Ruta incompleta.");return decode(s[index-1]);}
    private String decode(String s){return URLDecoder.decode(s,StandardCharsets.UTF_8);}
    private int parseId(String[] s,int index){try{return Integer.parseInt(s[index]);}catch(Exception ex){throw ApiException.badRequest("Identificador no válido.");}}
}
