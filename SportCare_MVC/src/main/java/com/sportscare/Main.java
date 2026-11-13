package com.sportscare;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportscare.config.AppConfig;
import com.sportscare.config.Database;
import com.sportscare.controller.*;
import com.sportscare.dao.*;
import com.sportscare.service.SessionManager;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiRouter;
import com.sportscare.util.ApiUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.Executors;

public class Main {
    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        Database.verifyConnection();
        SessionManager sessions=new SessionManager();
        UserDAO userDAO=new UserDAO();
        ApiRouter router=new ApiRouter(
                new AuthController(userDAO,sessions),
                new ExerciseController(new ExerciseDAO()),
                new UserController(userDAO),
                new DashboardController(new QuestionnaireDAO(),new ActivityDAO()),
                new StoreController(new ProductDAO(),new OrderDAO()),
                new PlanController(new PlanDAO()),
                new PqrsController(new PqrsDAO()),sessions,userDAO);

        HttpServer server=HttpServer.create(new InetSocketAddress("0.0.0.0",AppConfig.port()),0);
        server.createContext("/",exchange->handle(exchange,router));
        var executor=Executors.newFixedThreadPool(Math.max(8,Runtime.getRuntime().availableProcessors()));
        server.setExecutor(executor);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> { server.stop(0); executor.shutdownNow(); }));
        server.start();
        System.out.println("====================================================");
        System.out.println(" Sports Care MVC está ejecutándose");
        System.out.println(" Página: http://localhost:"+AppConfig.port()+"/SPT/index.html");
        System.out.println(" API:    http://localhost:"+AppConfig.port()+"/api/health");
        System.out.println(" Base de datos: sports_care");
        System.out.println("====================================================");
    }

    private static void handle(HttpExchange exchange,ApiRouter router)throws IOException{
        try{
            String path=exchange.getRequestURI().getPath();
            if(path.equals("/")){redirect(exchange,"/SPT/index.html");return;}
            if(path.equals("/SPT") || path.equals("/SPT/")){redirect(exchange,"/SPT/index.html");return;}
            if(path.startsWith("/api/")){
                exchange.getResponseHeaders().set("Cache-Control","no-store");
                exchange.getResponseHeaders().set("X-Content-Type-Options","nosniff");
                if(exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")){exchange.sendResponseHeaders(204,-1);exchange.close();return;}
                Object result=router.dispatch(exchange);
                sendJson(exchange,200,result);return;
            }
            serveStatic(exchange,path);
        }catch(ApiException ex){sendJson(exchange,ex.status(),ApiUtil.map("error",ex.getMessage()));}
        catch(Exception ex){
            ex.printStackTrace(System.err);
            try{sendJson(exchange,500,ApiUtil.map("error","Ocurrió un error interno. Revisa la consola de VS Code para ver el detalle."));}
            catch(Exception ignored){exchange.close();}
        }
    }

    private static void serveStatic(HttpExchange exchange,String urlPath)throws IOException{
        if(!urlPath.startsWith("/SPT/")){sendText(exchange,404,"Página no encontrada.");return;}
        Path root=Path.of(AppConfig.webRoot()).toAbsolutePath().normalize();
        String relative=urlPath.substring("/SPT/".length());
        Path file=root.resolve(relative).normalize();
        if(!file.startsWith(root)){sendText(exchange,403,"Acceso denegado.");return;}
        if(Files.isDirectory(file))file=file.resolve("index.html");
        if(!Files.isRegularFile(file)){sendText(exchange,404,"Archivo no encontrado.");return;}
        String contentType=contentType(file);
        exchange.getResponseHeaders().set("Content-Type",contentType);
        exchange.getResponseHeaders().set("X-Content-Type-Options","nosniff");
        if(contentType.startsWith("text/html")||contentType.contains("javascript")||contentType.contains("css"))exchange.getResponseHeaders().set("Cache-Control","no-cache");
        byte[] bytes=Files.readAllBytes(file);exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();
    }

    private static String contentType(Path file){
        String name=file.getFileName().toString().toLowerCase();
        if(name.endsWith(".html"))return "text/html; charset=utf-8";
        if(name.endsWith(".css"))return "text/css; charset=utf-8";
        if(name.endsWith(".js"))return "application/javascript; charset=utf-8";
        if(name.endsWith(".json"))return "application/json; charset=utf-8";
        if(name.endsWith(".svg"))return "image/svg+xml";
        if(name.endsWith(".png"))return "image/png";
        if(name.endsWith(".jpg")||name.endsWith(".jpeg"))return "image/jpeg";
        if(name.endsWith(".webp"))return "image/webp";
        if(name.endsWith(".ico"))return "image/x-icon";
        return "application/octet-stream";
    }
    private static void redirect(HttpExchange ex,String location)throws IOException{
        ex.getResponseHeaders().set("Location",location);ex.sendResponseHeaders(302,-1);ex.close();
    }
    private static void sendJson(HttpExchange ex,int status,Object value)throws IOException{
        byte[] bytes=JSON.writeValueAsBytes(value);ex.getResponseHeaders().set("Content-Type","application/json; charset=utf-8");
        ex.getResponseHeaders().set("Cache-Control","no-store");ex.sendResponseHeaders(status,bytes.length);ex.getResponseBody().write(bytes);ex.close();
    }
    private static void sendText(HttpExchange ex,int status,String value)throws IOException{
        byte[] bytes=value.getBytes(java.nio.charset.StandardCharsets.UTF_8);ex.getResponseHeaders().set("Content-Type","text/plain; charset=utf-8");
        ex.sendResponseHeaders(status,bytes.length);ex.getResponseBody().write(bytes);ex.close();
    }
}
