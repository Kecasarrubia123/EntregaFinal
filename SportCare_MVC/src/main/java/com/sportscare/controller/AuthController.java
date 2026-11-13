package com.sportscare.controller;

import com.sportscare.dao.UserDAO;
import com.sportscare.model.AuthAccount;
import com.sportscare.model.User;
import com.sportscare.service.PasswordService;
import com.sportscare.service.SessionManager;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;
import com.sun.net.httpserver.HttpExchange;

import java.sql.SQLException;
import java.util.Locale;
import java.util.Map;

public class AuthController extends ControllerSupport {
    private final UserDAO users; private final SessionManager sessions;
    public AuthController(UserDAO users,SessionManager sessions){this.users=users;this.sessions=sessions;}

    public Map<String,Object> register(HttpExchange exchange,Map<String,Object> body)throws SQLException{
        String name=ApiUtil.text(body,"name"),email=ApiUtil.text(body,"email").toLowerCase(Locale.ROOT),password=ApiUtil.text(body,"password");
        if(name.isBlank()||email.isBlank()||!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))throw ApiException.badRequest("Escribe un nombre y un correo electrónico válido.");
        if(password.length()<6)throw ApiException.badRequest("La contraseña debe tener al menos 6 caracteres.");
        if(users.findAccountByEmail(email)!=null)throw ApiException.conflict("El correo electrónico ya está registrado.");
        User user=users.createRegularUser(name,email,PasswordService.hash(password));sessions.start(exchange,user);
        return ApiUtil.map("user",user);
    }
    public Map<String,Object> login(HttpExchange exchange,Map<String,Object> body)throws SQLException{
        String email=ApiUtil.text(body,"email").toLowerCase(Locale.ROOT),password=ApiUtil.text(body,"password");
        AuthAccount account=users.findAccountByEmail(email);
        if(account==null||!account.user().active()||!PasswordService.verify(password,account.passwordHash()))throw ApiException.unauthorized();
        sessions.start(exchange,account.user());return ApiUtil.map("user",account.user());
    }
    public Map<String,Object> me(User user){return ApiUtil.map("user",requireUser(user));}
    public Map<String,Object> logout(HttpExchange exchange){sessions.end(exchange);return ApiUtil.map("message","Sesión cerrada.");}
}
