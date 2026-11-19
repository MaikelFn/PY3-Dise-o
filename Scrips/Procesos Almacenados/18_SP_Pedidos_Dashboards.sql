BEGIN;

CREATE OR REPLACE FUNCTION public.sp_pedidos_listaradmin()
RETURNS TABLE (
    pedidoid INTEGER,
    fechapedido TIMESTAMP,
    estado VARCHAR(30),
    comprador VARCHAR(201),
    cantidadproductos BIGINT,
    total NUMERIC(12,2)
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        p.pedidoid,
        p.fechapedido,
        ep.nombre::VARCHAR(30),
        (u.nombre || ' ' || u.apellido)::VARCHAR(201),
        COALESCE(SUM(dp.cantidad), 0)::BIGINT,
        p.total
    FROM public.pedidos p
    INNER JOIN public.usuarios u
        ON u.usuarioid = p.usuarioid
    INNER JOIN public.estadospedido ep
        ON ep.estadopedidoid = p.estadopedidoid
    LEFT JOIN public.detallespedido dp
        ON dp.pedidoid = p.pedidoid
    GROUP BY
        p.pedidoid,
        p.fechapedido,
        ep.nombre,
        u.nombre,
        u.apellido,
        p.total
    ORDER BY p.fechapedido DESC, p.pedidoid DESC;
$$;

CREATE OR REPLACE FUNCTION public.sp_pedidos_listarporvendedor(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    pedidoid INTEGER,
    fechapedido TIMESTAMP,
    estado VARCHAR(30),
    comprador VARCHAR(201),
    cantidadproductos BIGINT,
    subtotalvendedor NUMERIC(12,2)
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        p.pedidoid,
        p.fechapedido,
        ep.nombre::VARCHAR(30),
        (u.nombre || ' ' || u.apellido)::VARCHAR(201),
        SUM(dp.cantidad)::BIGINT,
        SUM(dp.subtotal)::NUMERIC(12,2)
    FROM public.pedidos p
    INNER JOIN public.usuarios u
        ON u.usuarioid = p.usuarioid
    INNER JOIN public.estadospedido ep
        ON ep.estadopedidoid = p.estadopedidoid
    INNER JOIN public.detallespedido dp
        ON dp.pedidoid = p.pedidoid
    INNER JOIN public.productos pr
        ON pr.productoid = dp.productoid
    INNER JOIN public.vendedores v
        ON v.vendedorid = pr.vendedorid
    WHERE v.usuarioid = p_usuarioid
    GROUP BY
        p.pedidoid,
        p.fechapedido,
        ep.nombre,
        u.nombre,
        u.apellido
    ORDER BY p.fechapedido DESC, p.pedidoid DESC;
$$;

COMMIT;
