USE sports_care;

DROP PROCEDURE IF EXISTS sp_sportcare_add_index_if_missing;

CREATE PROCEDURE sp_sportcare_add_index_if_missing(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(500)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*)
      INTO v_exists
      FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = p_table
       AND INDEX_NAME = p_index;

    IF v_exists = 0 THEN
        SET @sportcare_ddl = CONCAT(
            'CREATE INDEX `', REPLACE(p_index, '`', '``'),
            '` ON `', REPLACE(p_table, '`', '``'),
            '` (', p_columns, ')'
        );

        PREPARE sportcare_stmt FROM @sportcare_ddl;
        EXECUTE sportcare_stmt;
        DEALLOCATE PREPARE sportcare_stmt;
    END IF;
END//
DELIMITER ;

CALL sp_sportcare_add_index_if_missing(
    'usuarios', 'idx_usuarios_rol_estado', 'rol_id, estado'
);

CALL sp_sportcare_add_index_if_missing(
    'ejercicios', 'idx_ejercicios_activo_categoria_nivel', 'activo, categoria_id, nivel'
);

CALL sp_sportcare_add_index_if_missing(
    'grupo_miembros', 'idx_grupo_miembros_usuario_grupo', 'usuario_id, grupo_id'
);

CALL sp_sportcare_add_index_if_missing(
    'rutinas', 'idx_rutinas_institucion_activa', 'institucion_id, activa'
);

CALL sp_sportcare_add_index_if_missing(
    'asignaciones_rutina', 'idx_asignaciones_rutina_estado_fecha', 'rutina_id, estado, fecha_inicio'
);

CALL sp_sportcare_add_index_if_missing(
    'productos', 'idx_productos_activo_categoria_nombre', 'activo, categoria_id, nombre'
);

CALL sp_sportcare_add_index_if_missing(
    'pedidos', 'idx_pedidos_usuario_fecha', 'usuario_id, creado_en'
);

CALL sp_sportcare_add_index_if_missing(
    'pedidos', 'idx_pedidos_estado_fecha', 'estado, creado_en'
);

CALL sp_sportcare_add_index_if_missing(
    'pedido_detalles', 'idx_pedido_detalles_pedido_producto', 'pedido_id, producto_id'
);

CALL sp_sportcare_add_index_if_missing(
    'intereses_planes', 'idx_intereses_usuario_fecha', 'usuario_id, creado_en'
);

CALL sp_sportcare_add_index_if_missing(
    'pqrs', 'idx_pqrs_usuario_fecha', 'usuario_id, creado_en'
);

CALL sp_sportcare_add_index_if_missing(
    'pqrs', 'idx_pqrs_admin_estado', 'respondida_por, estado'
);

DROP PROCEDURE IF EXISTS sp_sportcare_add_index_if_missing;

ANALYZE TABLE
    roles,
    usuarios,
    perfiles,
    cuestionarios_iniciales,
    categorias_ejercicio,
    ejercicios,
    sesiones,
    sesion_ejercicios,
    objetivos,
    instituciones,
    grupos,
    grupo_miembros,
    rutinas,
    rutina_ejercicios,
    asignaciones_rutina,
    categorias_producto,
    productos,
    pedidos,
    pedido_detalles,
    planes,
    intereses_planes,
    pqrs;
