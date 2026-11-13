package com.sportscare.controller;

import com.sportscare.model.User;
import com.sportscare.util.ApiException;

public abstract class ControllerSupport {
    protected User requireUser(User user) { if (user == null || !user.active()) throw ApiException.unauthorized(); return user; }
    protected User requireAdmin(User user) { User u=requireUser(user); if(!u.isAdmin())throw ApiException.forbidden(); return u; }
    protected User requireRegularUser(User user) { User u=requireUser(user); if(u.isAdmin())throw ApiException.forbidden(); return u; }
}
