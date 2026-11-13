package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.Product;
import com.sportscare.util.ApiException;
import com.sportscare.util.ApiUtil;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;

public class OrderDAO {
    private final ProductDAO products=new ProductDAO();

    public Map<String,Object> create(Integer userId,String name,String email,String address,String method,List<?> requestedItems)throws SQLException{
        if(requestedItems==null||requestedItems.isEmpty())throw ApiException.badRequest("El carrito está vacío.");
        String code="SC-T-"+UUID.randomUUID().toString().replace("-","").substring(0,7).toUpperCase(Locale.ROOT);
        List<Map<String,Object>> details=new ArrayList<>();BigDecimal total=BigDecimal.ZERO;
        try(Connection c=Database.getConnection()){
            c.setAutoCommit(false);
            try{
                for(Object raw:requestedItems){
                    if(!(raw instanceof Map<?,?> item))throw ApiException.badRequest("Hay un producto inválido en el pedido.");
                    int productId=parseInt(item.get("productId"));int quantity=parseInt(item.get("quantity"));
                    if(quantity<1||quantity>99)throw ApiException.badRequest("La cantidad de cada producto debe estar entre 1 y 99.");
                    Product product=products.findActiveById(productId);
                    if(product==null)throw ApiException.badRequest("Uno de los productos ya no está disponible.");
                    BigDecimal subtotal=product.price().multiply(BigDecimal.valueOf(quantity));total=total.add(subtotal);
                    details.add(ApiUtil.map("productId",product.id(),"name",product.name(),"price",product.price(),"quantity",quantity,"subtotal",subtotal));
                }
                String sql="INSERT INTO pedidos(codigo_pedido,usuario_id,nombre_contacto,correo_contacto,direccion_entrega,metodo_pago_demo,subtotal,total,estado) VALUES(?,?,?,?,?,?,?,?,'Pedido simulado')";
                try(PreparedStatement ps=c.prepareStatement(sql)){
                    ps.setString(1,code);if(userId==null)ps.setNull(2,Types.INTEGER);else ps.setInt(2,userId);
                    ps.setString(3,name);ps.setString(4,email);ps.setString(5,address);ps.setString(6,method);
                    ps.setBigDecimal(7,total);ps.setBigDecimal(8,total);ps.executeUpdate();
                }
                String detailSql="INSERT INTO pedido_detalles(pedido_id,producto_id,nombre_producto,precio_unitario,cantidad,subtotal) SELECT p.id,?,?,?,?,? FROM pedidos p WHERE p.codigo_pedido=?";
                for(Map<String,Object> d:details){
                    try(PreparedStatement ps=c.prepareStatement(detailSql)){
                        ps.setInt(1,(Integer)d.get("productId"));ps.setString(2,(String)d.get("name"));ps.setBigDecimal(3,(BigDecimal)d.get("price"));
                        ps.setInt(4,(Integer)d.get("quantity"));ps.setBigDecimal(5,(BigDecimal)d.get("subtotal"));ps.setString(6,code);ps.executeUpdate();
                    }
                }
                c.commit();
            }catch(Exception ex){c.rollback();if(ex instanceof SQLException sql)throw sql;if(ex instanceof RuntimeException runtime)throw runtime;throw new SQLException(ex);}
            finally{c.setAutoCommit(true);}
        }
        return ApiUtil.map("id",code,"createdAt",LocalDateTime.now().toString(),"buyerName",name,"buyerEmail",email,"address",address,"method",method,"total",total,"status","Pedido simulado","items",details);
    }

    public List<Map<String,Object>> findAll()throws SQLException{
        String sql="SELECT p.id,p.codigo_pedido,p.creado_en,p.nombre_contacto,p.correo_contacto,p.direccion_entrega,p.metodo_pago_demo,p.total,p.estado, " +
                "d.producto_id,d.nombre_producto,d.precio_unitario,d.cantidad,d.subtotal " +
                "FROM pedidos p LEFT JOIN pedido_detalles d ON d.pedido_id=p.id ORDER BY p.creado_en DESC,d.id";
        Map<Integer,Map<String,Object>> grouped=new LinkedHashMap<>();
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql);ResultSet rs=ps.executeQuery()){
            while(rs.next()){
                int orderPk=rs.getInt("id");
                Map<String,Object> order=grouped.get(orderPk);
                if(order==null){
                    order=ApiUtil.map("id",rs.getString("codigo_pedido"),"createdAt",rs.getTimestamp("creado_en").toLocalDateTime().toString(),
                            "buyerName",rs.getString("nombre_contacto"),"buyerEmail",rs.getString("correo_contacto"),"address",rs.getString("direccion_entrega"),
                            "method",rs.getString("metodo_pago_demo"),"total",rs.getBigDecimal("total"),"status",rs.getString("estado"),"items",new ArrayList<Map<String,Object>>());
                    grouped.put(orderPk,order);
                }
                if(rs.getObject("nombre_producto")!=null){
                    @SuppressWarnings("unchecked") List<Map<String,Object>> items=(List<Map<String,Object>>)order.get("items");
                    items.add(ApiUtil.map("productId",rs.getObject("producto_id"),"name",rs.getString("nombre_producto"),"price",rs.getBigDecimal("precio_unitario"),
                            "quantity",rs.getInt("cantidad"),"subtotal",rs.getBigDecimal("subtotal")));
                }
            }
        }
        return new ArrayList<>(grouped.values());
    }

    public void updateStatus(String code,String status)throws SQLException{
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement("UPDATE pedidos SET estado=? WHERE codigo_pedido=?")){
            ps.setString(1,status);ps.setString(2,code);if(ps.executeUpdate()==0)throw ApiException.notFound("No se encontró el pedido.");
        }
    }
    private int parseInt(Object value){try{return new java.math.BigDecimal(String.valueOf(value)).intValueExact();}catch(Exception ex){throw ApiException.badRequest("La cantidad o el producto del pedido no es válido.");}}
}
