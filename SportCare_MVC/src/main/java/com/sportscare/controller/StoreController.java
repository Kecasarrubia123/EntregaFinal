package com.sportscare.controller;

import com.sportscare.dao.OrderDAO;
import com.sportscare.dao.ProductDAO;
import com.sportscare.model.Product;
import com.sportscare.model.User;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class StoreController extends ControllerSupport {
    private final ProductDAO products;private final OrderDAO orders;
    public StoreController(ProductDAO p,OrderDAO o){products=p;orders=o;}
    public List<Product> products()throws SQLException{return products.findAllActive();}
    public Map<String,Object> createOrder(User current,Map<String,Object> body)throws SQLException{
        String name=ApiUtil.text(body,"buyerName"),email=ApiUtil.text(body,"buyerEmail").toLowerCase(Locale.ROOT),address=ApiUtil.text(body,"address"),method=ApiUtil.text(body,"method");
        if(name.isBlank()||address.isBlank()||email.isBlank()||!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))throw ApiException.badRequest("Completa los datos del comprador con un correo válido.");
        if(method.isBlank())throw ApiException.badRequest("Selecciona un método de pago de demostración.");
        Object items=body.get("items");if(!(items instanceof List<?> list))throw ApiException.badRequest("El pedido no contiene productos.");
        return orders.create(current==null?null:current.id(),name,email,address,method,list);
    }
    public List<Map<String,Object>> adminOrders(User user)throws SQLException{requireAdmin(user);return orders.findAll();}
    public Map<String,Object> updateOrder(User user,String code,Map<String,Object> body)throws SQLException{
        requireAdmin(user);String status=ApiUtil.text(body,"status");
        if(!List.of("Pedido simulado","En preparación (demo)","Entregado (demo)","Cancelado (demo)").contains(status))throw ApiException.badRequest("Estado de pedido no permitido.");
        orders.updateStatus(code,status);return ApiUtil.map("message","Estado del pedido actualizado.");
    }
}
