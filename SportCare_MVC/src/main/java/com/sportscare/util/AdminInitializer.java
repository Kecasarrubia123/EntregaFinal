package com.sportscare.util;

import com.sportscare.dao.UserDAO;
import com.sportscare.service.PasswordService;

import java.io.Console;
import java.util.Scanner;

/** Crea el primer administrador sin guardar contraseñas en el SQL. */
public class AdminInitializer {
    public static void main(String[] args)throws Exception{
        UserDAO dao=new UserDAO();
        if(dao.countAdmins()>0){System.out.println("Ya existe al menos una cuenta ADMINISTRADOR. No se creó otra.");return;}
        Console console=System.console();
        Scanner scanner=console==null?new Scanner(System.in):null;
        System.out.print("Nombre del administrador: ");String name=console!=null?console.readLine():scanner.nextLine();
        System.out.print("Correo del administrador: ");String email=(console!=null?console.readLine():scanner.nextLine()).trim().toLowerCase();
        char[] pass;
        if(console!=null) pass=console.readPassword("Contraseña (mínimo 8 caracteres): ");
        else { System.out.print("Contraseña (mínimo 8 caracteres): "); pass=scanner.nextLine().toCharArray(); }
        String password=new String(pass);
        if(name.isBlank()||!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")||password.length()<8){System.out.println("Datos no válidos. No se creó el administrador.");return;}
        if(dao.findAccountByEmail(email)!=null){System.out.println("Ese correo ya está registrado. No se creó el administrador.");return;}
        dao.createAdmin(name.trim(),email,PasswordService.hash(password));
        java.util.Arrays.fill(pass,'\0');
        System.out.println("Cuenta ADMINISTRADOR creada correctamente. Ya puedes iniciar sesión desde index.html.");
    }
}
