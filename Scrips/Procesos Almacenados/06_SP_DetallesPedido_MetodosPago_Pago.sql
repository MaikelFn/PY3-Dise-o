
BEGIN;

-- ============================================================
-- CLICKMARKET - POSTGRESQL 18 / NEON
-- MODULOS 12, 13 Y 14
-- TOTAL: 8 FUNCIONES
-- ============================================================


-- ============================================================
-- 12. DETALLES PEDIDO
-- ============================================================

-- 12.1 LISTAR DETALLES POR PEDIDO
-- Los detalles son historicos y no se editan directamente.

CREATE OR REPLACE FUNCTION public.sp_detallespedido_listarporpedido(
    p_pedidoid INTEGER
)
RETURNS TABLE (
    detallepedidoid INTEGER,
    pedidoid INTEGER,
    productoid INTEGER,
    producto VARCHAR,
    cantidad INTEGER,
    preciounitario NUMERIC,
    subtotal NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dp.detallepedidoid,
        dp.pedidoid,
        dp.productoid,
        p.nombre::VARCHAR,
        dp.cantidad,
        dp.preciounitario::NUMERIC,
        dp.subtotal::NUMERIC
    FROM public.detallespedido dp
    INNER JOIN public.productos p
        ON p.productoid = dp.productoid
    WHERE dp.pedidoid = p_pedidoid
    ORDER BY dp.detallepedidoid;
END;
$$;


-- ============================================================
-- 13. METODOS DE PAGO
-- ============================================================

-- 13.1 LISTAR METODOS DE PAGO

CREATE OR REPLACE FUNCTION public.sp_metodospago_listar()
RETURNS TABLE (
    metodopagoid INTEGER,
    nombre VARCHAR,
    descripcion VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mp.metodopagoid,
        mp.nombre::VARCHAR,
        mp.descripcion::VARCHAR
    FROM public.metodospago mp
    ORDER BY mp.metodopagoid;
END;
$$;


-- ============================================================
-- 14. PAGOS
-- ============================================================

-- 14.1 CONSULTAR PAGO POR ID
-- Se define primero porque Registrar y Rechazar la utilizan.

CREATE OR REPLACE FUNCTION public.sp_pagos_consultarporid(
    p_pagoid INTEGER
)
RETURNS TABLE (
    pagoid INTEGER,
    pedidoid INTEGER,
    metodopagoid INTEGER,
    metodopago VARCHAR,
    monto NUMERIC,
    estado VARCHAR,
    fechapago TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pa.pagoid,
        pa.pedidoid,
        pa.metodopagoid,
        mp.nombre::VARCHAR,
        pa.monto::NUMERIC,
        pa.estado::VARCHAR,
        pa.fechapago
    FROM public.pagos pa
    INNER JOIN public.metodospago mp
        ON mp.metodopagoid = pa.metodopagoid
    WHERE pa.pagoid = p_pagoid;
END;
$$;


-- 14.2 LISTAR PAGOS POR PEDIDO

CREATE OR REPLACE FUNCTION public.sp_pagos_listarporpedido(
    p_pedidoid INTEGER
)
RETURNS TABLE (
    pagoid INTEGER,
    pedidoid INTEGER,
    metodopagoid INTEGER,
    metodopago VARCHAR,
    monto NUMERIC,
    estado VARCHAR,
    fechapago TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pa.pagoid,
        pa.pedidoid,
        pa.metodopagoid,
        mp.nombre::VARCHAR,
        pa.monto::NUMERIC,
        pa.estado::VARCHAR,
        pa.fechapago
    FROM public.pagos pa
    INNER JOIN public.metodospago mp
        ON mp.metodopagoid = pa.metodopagoid
    WHERE pa.pedidoid = p_pedidoid
    ORDER BY pa.pagoid DESC;
END;
$$;


-- 14.3 REGISTRAR PAGO

CREATE OR REPLACE FUNCTION public.sp_pagos_registrar(
    p_pedidoid INTEGER,
    p_metodopagoid INTEGER,
    p_usuarioid INTEGER
)
RETURNS TABLE (
    pagoid INTEGER,
    pedidoid INTEGER,
    metodopagoid INTEGER,
    metodopago VARCHAR,
    monto NUMERIC,
    estado VARCHAR,
    fechapago TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_monto NUMERIC(12,2);
    v_pagoid INTEGER;
BEGIN
    -- Bloquear el pedido para coordinar operaciones de pago.
    SELECT p.total
    INTO v_monto
    FROM public.pedidos p
    INNER JOIN public.estadospedido ep
        ON ep.estadopedidoid = p.estadopedidoid
    WHERE p.pedidoid = p_pedidoid
      AND p.usuarioid = p_usuarioid
      AND ep.nombre = 'Pendiente'
    FOR UPDATE OF p;

    IF v_monto IS NULL THEN
        RAISE EXCEPTION
            'El pedido no existe, no pertenece al usuario o no esta pendiente.';
    END IF;

    -- Validar metodo de pago.
    IF NOT EXISTS (
        SELECT 1
        FROM public.metodospago mp
        WHERE mp.metodopagoid = p_metodopagoid
    ) THEN
        RAISE EXCEPTION 'Metodo de pago inexistente.';
    END IF;

    -- Impedir pagos pendientes o aprobados duplicados.
    IF EXISTS (
        SELECT 1
        FROM public.pagos pa
        WHERE pa.pedidoid = p_pedidoid
          AND pa.estado IN ('Pendiente', 'Aprobado')
    ) THEN
        RAISE EXCEPTION
            'Ya existe un pago pendiente o aprobado para este pedido.';
    END IF;

    -- Registrar pago pendiente.
    INSERT INTO public.pagos AS pa (
        pedidoid,
        metodopagoid,
        monto,
        estado
    )
    VALUES (
        p_pedidoid,
        p_metodopagoid,
        v_monto,
        'Pendiente'
    )
    RETURNING pa.pagoid INTO v_pagoid;

    RETURN QUERY
    SELECT *
    FROM public.sp_pagos_consultarporid(v_pagoid);
END;
$$;


-- 14.4 APROBAR PAGO
-- Solo debe llamarse desde el backend autorizado.
-- La pasarela externa debe haber confirmado el pago.

CREATE OR REPLACE FUNCTION public.sp_pagos_aprobar(
    p_pagoid INTEGER
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
    v_pedidoid INTEGER;
    v_monto NUMERIC(12,2);
    v_total NUMERIC(12,2);
    v_filas INTEGER;
BEGIN
    -- Identificar el pedido asociado al pago.
    SELECT pa.pedidoid, pa.monto
    INTO v_pedidoid, v_monto
    FROM public.pagos pa
    WHERE pa.pagoid = p_pagoid;

    IF v_pedidoid IS NULL THEN
        RAISE EXCEPTION 'Pago inexistente.';
    END IF;

    -- Bloquear el pedido.
    SELECT p.total
    INTO v_total
    FROM public.pedidos p
    INNER JOIN public.estadospedido ep
        ON ep.estadopedidoid = p.estadopedidoid
    WHERE p.pedidoid = v_pedidoid
      AND ep.nombre = 'Pendiente'
    FOR UPDATE OF p;

    IF v_total IS NULL THEN
        RAISE EXCEPTION 'El pedido no esta pendiente.';
    END IF;

    -- Comprobar monto.
    IF v_monto <> v_total THEN
        RAISE EXCEPTION
            'El monto no coincide con el total del pedido.';
    END IF;

    -- Aprobar pago pendiente.
    UPDATE public.pagos pa
    SET
        estado = 'Aprobado',
        fechapago = LOCALTIMESTAMP
    WHERE pa.pagoid = p_pagoid
      AND pa.estado = 'Pendiente';

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas <> 1 THEN
        RAISE EXCEPTION 'El pago ya fue procesado.';
    END IF;

    -- Confirmar pedido y consumir la reserva.
    -- Si falla, PostgreSQL revierte toda la operacion.
    RETURN QUERY
    SELECT *
    FROM public.sp_pedidos_confirmar(v_pedidoid);
END;
$$;


-- 14.5 RECHAZAR PAGO
-- Permite registrar otro intento posteriormente.
-- No libera el inventario reservado.

CREATE OR REPLACE FUNCTION public.sp_pagos_rechazar(
    p_pagoid INTEGER
)
RETURNS TABLE (
    pagoid INTEGER,
    pedidoid INTEGER,
    metodopagoid INTEGER,
    metodopago VARCHAR,
    monto NUMERIC,
    estado VARCHAR,
    fechapago TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_pedidoid INTEGER;
    v_filas INTEGER;
BEGIN
    SELECT pa.pedidoid
    INTO v_pedidoid
    FROM public.pagos pa
    WHERE pa.pagoid = p_pagoid;

    IF v_pedidoid IS NULL THEN
        RAISE EXCEPTION 'Pago inexistente.';
    END IF;

    -- Bloquear el pedido y verificar que siga pendiente.
    PERFORM 1
    FROM public.pedidos p
    INNER JOIN public.estadospedido ep
        ON ep.estadopedidoid = p.estadopedidoid
    WHERE p.pedidoid = v_pedidoid
      AND ep.nombre = 'Pendiente'
    FOR UPDATE OF p;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido no esta pendiente.';
    END IF;

    UPDATE public.pagos pa
    SET
        estado = 'Rechazado',
        fechapago = LOCALTIMESTAMP
    WHERE pa.pagoid = p_pagoid
      AND pa.estado = 'Pendiente';

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas <> 1 THEN
        RAISE EXCEPTION 'El pago ya fue procesado.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_pagos_consultarporid(p_pagoid);
END;
$$;

COMMIT;
