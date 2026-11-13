package com.sportscare.dao;

import com.sportscare.config.Database;
import com.sportscare.model.Product;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductDAO {
    public List<Product> findAllActive() throws SQLException {
        String sql="SELECT p.id,p.nombre,c.nombre AS categoria,p.precio_referencia,p.imagen_url,p.descripcion FROM productos p LEFT JOIN categorias_producto c ON c.id=p.categoria_id WHERE p.activo=1 ORDER BY p.id";
        List<Product> products=new ArrayList<>();
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql);ResultSet rs=ps.executeQuery()){
            while(rs.next())products.add(toProduct(rs));
        }
        return products;
    }
    public Product findActiveById(int id) throws SQLException {
        String sql="SELECT p.id,p.nombre,c.nombre AS categoria,p.precio_referencia,p.imagen_url,p.descripcion FROM productos p LEFT JOIN categorias_producto c ON c.id=p.categoria_id WHERE p.id=? AND p.activo=1";
        try(Connection c=Database.getConnection();PreparedStatement ps=c.prepareStatement(sql)){
            ps.setInt(1,id);try(ResultSet rs=ps.executeQuery()){return rs.next()?toProduct(rs):null;}
        }
    }
    private Product toProduct(ResultSet rs)throws SQLException{
        return new Product(rs.getInt("id"),rs.getString("nombre"),rs.getString("categoria"),rs.getBigDecimal("precio_referencia"),rs.getString("imagen_url"),rs.getString("descripcion"));
    }
}
