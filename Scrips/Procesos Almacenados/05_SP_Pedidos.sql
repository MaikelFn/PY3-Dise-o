
BEGIN;

-- ============================================================
-- CLICKMARKET - POSTGRESQL 18 / NEON
-- MODULO 11: PEDIDOS
-- TOTAL: 6 FUNCIONES
-- ============================================================

-- 11.1 CREAR PEDIDO DESDE CARRITO

CREATE OR REPLACE FUNCTION public.sp_pedidos_creardesdecarrito(
    p_usuarioid INTEGER,
    p_direccionid INTEGER,
    p_tipoenvioid INTEGER
)
RETURNS TABLE (pedidoid INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_carritoid INTEGER;
    v_estadopedidoid INTEGER;
    v_subtotal NUMERIC(12,2);
    v_subtotal_calculado NUMERIC;
    v_costoenvio NUMERIC(12,2);
    v_pedidoid INTEGER;
    v_linea RECORD;
    v_filas INTEGER;
BEGIN
    -- Bloquear usuario para evitar compras simultaneas.
    PERFORM 1
    FROM public.usuarios u
    WHERE u.usuarioid = p_usuarioid
      AND u.activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario inexistente o inactivo.';
    END IF;

    -- Validar direccion.
    IF NOT EXISTS (
        SELECT 1
        FROM public.direcciones d
        WHERE d.direccionid = p_direccionid
          AND d.usuarioid = p_usuarioid
    ) THEN
        RAISE EXCEPTION
            'La direccion no pertenece al usuario.';
    END IF;

    -- Obtener costo de envio.
    SELECT te.costobase
    INTO v_costoenvio
    FROM public.tiposenvio te
    WHERE te.tipoenvioid = p_tipoenvioid;

    IF v_costoenvio IS NULL THEN
        RAISE EXCEPTION 'Tipo de envio inexistente.';
    END IF;

    -- Obtener estado Pendiente.
    SELECT ep.estadopedidoid
    INTO v_estadopedidoid
    FROM public.estadospedido ep
    WHERE ep.nombre = 'Pendiente';

    IF v_estadopedidoid IS NULL THEN
        RAISE EXCEPTION 'Falta el estado Pendiente.';
    END IF;

    -- Obtener carrito y bloquearlo.
    SELECT c.carritoid
    INTO v_carritoid
    FROM public.carritos c
    WHERE c.usuarioid = p_usuarioid
    FOR UPDATE;

    IF v_carritoid IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.detallescarrito dc
        WHERE dc.carritoid = v_carritoid
    ) THEN
        RAISE EXCEPTION 'El carrito esta vacio.';
    END IF;

    -- Validar productos y vendedores.
    IF EXISTS (
        SELECT 1
        FROM public.detallescarrito dc
        LEFT JOIN public.productos p
            ON p.productoid = dc.productoid
        LEFT JOIN public.vendedores v
            ON v.vendedorid = p.vendedorid
        LEFT JOIN public.categorias ca
            ON ca.categoriaid = p.categoriaid
        WHERE dc.carritoid = v_carritoid
          AND (
              p.productoid IS NULL
              OR p.activo IS DISTINCT FROM TRUE
              OR v.activo IS DISTINCT FROM TRUE
              OR ca.categoriaid IS NULL
          )
    ) THEN
        RAISE EXCEPTION
            'El carrito contiene productos no disponibles.';
    END IF;

    -- Calcular importe antes de convertir a NUMERIC(12,2).
    SELECT SUM(dc.cantidad::NUMERIC * p.precio)
    INTO v_subtotal_calculado
    FROM public.detallescarrito dc
    JOIN public.productos p
        ON p.productoid = dc.productoid
    WHERE dc.carritoid = v_carritoid;

    IF v_subtotal_calculado IS NULL
       OR v_subtotal_calculado < 0
       OR v_costoenvio < 0
       OR v_subtotal_calculado + v_costoenvio > 9999999999.99
    THEN
        RAISE EXCEPTION
            'Total del pedido invalido o demasiado grande.';
    END IF;

    v_subtotal := v_subtotal_calculado;

    -- Reservar inventario en orden de producto.
    FOR v_linea IN
        SELECT dc.productoid, dc.cantidad
        FROM public.detallescarrito dc
        WHERE dc.carritoid = v_carritoid
        ORDER BY dc.productoid
    LOOP
        UPDATE public.inventarios i
        SET
            cantidaddisponible =
                i.cantidaddisponible - v_linea.cantidad,
            cantidadreservada =
                i.cantidadreservada + v_linea.cantidad
        WHERE i.productoid = v_linea.productoid
          AND v_linea.cantidad > 0
          AND i.cantidaddisponible >= v_linea.cantidad
          AND i.cantidadreservada <=
              2147483647 - v_linea.cantidad;

        GET DIAGNOSTICS v_filas = ROW_COUNT;

        IF v_filas <> 1 THEN
            RAISE EXCEPTION
                'Inventario insuficiente para uno o mas productos.';
        END IF;
    END LOOP;

    -- Crear pedido.
    INSERT INTO public.pedidos AS ped (
        usuarioid,
        direccionid,
        estadopedidoid,
        subtotal,
        costoenvio,
        total
    )
    VALUES (
        p_usuarioid,
        p_direccionid,
        v_estadopedidoid,
        v_subtotal,
        v_costoenvio,
        v_subtotal + v_costoenvio
    )
    RETURNING ped.pedidoid INTO v_pedidoid;

    -- Copiar productos al detalle del pedido.
    INSERT INTO public.detallespedido (
        pedidoid,
        productoid,
        cantidad,
        preciounitario,
        subtotal
    )
    SELECT
        v_pedidoid,
        dc.productoid,
        dc.cantidad,
        p.precio,
        dc.cantidad::NUMERIC * p.precio
    FROM public.detallescarrito dc
    JOIN public.productos p
        ON p.productoid = dc.productoid
    WHERE dc.carritoid = v_carritoid;

    -- Crear envio.
    INSERT INTO public.envios (
        pedidoid,
        tipoenvioid,
        costo,
        estado
    )
    VALUES (
        v_pedidoid,
        p_tipoenvioid,
        v_costoenvio,
        'Pendiente'
    );

    -- Vaciar carrito despues de crear el pedido.
    DELETE FROM public.detallescarrito dc
    WHERE dc.carritoid = v_carritoid;

    RETURN QUERY SELECT v_pedidoid;
END;
$$;


-- ============================================================
-- 11.2 CONSULTAR PEDIDO POR ID
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_pedidos_consultarporid(
    p_pedidoid INTEGER
)
RETURNS TABLE (
    pedidoid INTEGER,
    usuarioid INTEGER,
    direccionid INTEGER,
    estadopedidoid INTEGER,
    estadopedido VARCHAR,
    fechapedido TIMESTAMP,
    subtotal NUMERIC,
    costoenvio NUMERIC,
    total NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.pedidoid,
        p.usuarioid,
        p.direccionid,
        p.estadopedidoid,
        ep.nombre::VARCHAR,
        p.fechapedido,
        p.subtotal::NUMERIC,
        p.costoenvio::NUMERIC,
        p.total::NUMERIC
    FROM public.pedidos p
    JOIN public.estadospedido ep
        ON ep.estadopedidoid = p.estadopedidoid
    WHERE p.pedidoid = p_pedidoid;
END;
$$;


-- ============================================================
-- 11.3 LISTAR PEDIDOS POR USUARIO
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_pedidos_listarporusuario(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    pedidoid INTEGER,
    usuarioid INTEGER,
    direccionid INTEGER,
    estadopedido VARCHAR,
    fechapedido TIMESTAMP,
    subtotal NUMERIC,
    costoenvio NUMERIC,
    total NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.pedidoid,
        p.usuarioid,
        p.direccionid,
        ep.nombre::VARCHAR,
        p.fechapedido,
        p.subtotal::NUMERIC,
        p.costoenvio::NUMERIC,
        p.total::NUMERIC
    FROM public.pedidos p
    JOIN public.estadospedido ep
        ON ep.estadopedidoid = p.estadopedidoid
    WHERE p.usuarioid = p_usuarioid
    ORDER BY p.fechapedido DESC, p.pedidoid DESC;
END;
$$;


-- ============================================================
-- 11.4 CONFIRMAR PEDIDO
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_pedidos_confirmar(
    p_pedidoid INTEGER
)
RETURNS TABLE (
    pedidoid INTEGER,
    usuarioid INTEGER,
    direccionid INTEGER,
    estadopedidoid INTEGER,
    estadopedido VARCHAR,
    fechapedido TIMESTAMP,
    subtotal NUMERIC,
    costoenvio NUMERIC,
    total NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_pendiente INTEGER;
    v_confirmado INTEGER;
    v_linea RECORD;
    v_filas INTEGER;
BEGIN
    SELECT ep.estadopedidoid
    INTO v_pendiente
    FROM public.estadospedido ep
    WHERE ep.nombre = 'Pendiente';

    SELECT ep.estadopedidoid
    INTO v_confirmado
    FROM public.estadospedido ep
    WHERE ep.nombre = 'Confirmado';

    IF v_pendiente IS NULL OR v_confirmado IS NULL THEN
        RAISE EXCEPTION 'Faltan estados de pedido.';
    END IF;

    -- Bloquear pedido.
    PERFORM 1
    FROM public.pedidos p
    WHERE p.pedidoid = p_pedidoid
    FOR UPDATE;

    -- Comprobar pago aprobado.
    IF NOT EXISTS (
        SELECT 1
        FROM public.pagos pg
        WHERE pg.pedidoid = p_pedidoid
          AND pg.estado = 'Aprobado'
    ) THEN
        RAISE EXCEPTION
            'No existe un pago aprobado para el pedido.';
    END IF;

    -- Cambiar estado una sola vez.
    UPDATE public.pedidos p
    SET estadopedidoid = v_confirmado
    WHERE p.pedidoid = p_pedidoid
      AND p.estadopedidoid = v_pendiente;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas <> 1 THEN
        RAISE EXCEPTION 'El pedido no esta pendiente.';
    END IF;

    -- Consumir inventario reservado.
    FOR v_linea IN
        SELECT
            dp.productoid,
            SUM(dp.cantidad)::INTEGER AS cantidad
        FROM public.detallespedido dp
        WHERE dp.pedidoid = p_pedidoid
        GROUP BY dp.productoid
        ORDER BY dp.productoid
    LOOP
        UPDATE public.inventarios i
        SET cantidadreservada =
            i.cantidadreservada - v_linea.cantidad
        WHERE i.productoid = v_linea.productoid
          AND i.cantidadreservada >= v_linea.cantidad;

        GET DIAGNOSTICS v_filas = ROW_COUNT;

        IF v_filas <> 1 THEN
            RAISE EXCEPTION
                'No se pudo confirmar la salida del inventario.';
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT *
    FROM public.sp_pedidos_consultarporid(p_pedidoid);
END;
$$;


-- ============================================================
-- 11.5 CANCELAR PEDIDO
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_pedidos_cancelar(
    p_pedidoid INTEGER
)
RETURNS TABLE (
    pedidoid INTEGER,
    usuarioid INTEGER,
    direccionid INTEGER,
    estadopedidoid INTEGER,
    estadopedido VARCHAR,
    fechapedido TIMESTAMP,
    subtotal NUMERIC,
    costoenvio NUMERIC,
    total NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_pendiente INTEGER;
    v_cancelado INTEGER;
    v_linea RECORD;
    v_filas INTEGER;
BEGIN
    SELECT ep.estadopedidoid
    INTO v_pendiente
    FROM public.estadospedido ep
    WHERE ep.nombre = 'Pendiente';

    SELECT ep.estadopedidoid
    INTO v_cancelado
    FROM public.estadospedido ep
    WHERE ep.nombre = 'Cancelado';

    IF v_pendiente IS NULL OR v_cancelado IS NULL THEN
        RAISE EXCEPTION 'Faltan estados de pedido.';
    END IF;

    -- Bloquear pedido pendiente.
    PERFORM 1
    FROM public.pedidos p
    WHERE p.pedidoid = p_pedidoid
      AND p.estadopedidoid = v_pendiente
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Solo pueden cancelarse pedidos pendientes.';
    END IF;

    -- No cancelar pedidos con pago aprobado.
    IF EXISTS (
        SELECT 1
        FROM public.pagos pg
        WHERE pg.pedidoid = p_pedidoid
          AND pg.estado = 'Aprobado'
    ) THEN
        RAISE EXCEPTION
            'Un pedido con pago aprobado requiere reembolso.';
    END IF;

    -- Liberar inventario reservado.
    FOR v_linea IN
        SELECT
            dp.productoid,
            SUM(dp.cantidad)::INTEGER AS cantidad
        FROM public.detallespedido dp
        WHERE dp.pedidoid = p_pedidoid
        GROUP BY dp.productoid
        ORDER BY dp.productoid
    LOOP
        UPDATE public.inventarios i
        SET
            cantidadreservada =
                i.cantidadreservada - v_linea.cantidad,
            cantidaddisponible =
                i.cantidaddisponible + v_linea.cantidad
        WHERE i.productoid = v_linea.productoid
          AND i.cantidadreservada >= v_linea.cantidad
          AND i.cantidaddisponible <=
              2147483647 - v_linea.cantidad;

        GET DIAGNOSTICS v_filas = ROW_COUNT;

        IF v_filas <> 1 THEN
            RAISE EXCEPTION
                'No se pudo liberar el inventario reservado.';
        END IF;
    END LOOP;

    -- Actualizar estado.
    UPDATE public.pedidos p
    SET estadopedidoid = v_cancelado
    WHERE p.pedidoid = p_pedidoid
      AND p.estadopedidoid = v_pendiente;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas <> 1 THEN
        RAISE EXCEPTION
            'Solo pueden cancelarse pedidos pendientes.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_pedidos_consultarporid(p_pedidoid);
END;
$$;


-- ============================================================
-- 11.6 VALIDAR ACCESO
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_pedidos_validaracceso(
    p_pedidoid INTEGER,
    p_usuarioid INTEGER
)
RETURNS TABLE (pedidoid INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT p.pedidoid
    FROM public.pedidos p
    WHERE p.pedidoid = p_pedidoid
      AND (
          p.usuarioid = p_usuarioid
          OR EXISTS (
              SELECT 1
              FROM public.usuarios u
              INNER JOIN public.roles r
                  ON r.rolid = u.rolid
              WHERE u.usuarioid = p_usuarioid
                AND r.nombre = 'Administrador'
          )
      );
END;
$$;

COMMIT;
