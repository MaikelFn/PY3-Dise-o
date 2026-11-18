
-- ============================================================
-- CLICKMARKET - POSTGRESQL 18 / NEON
-- MODULOS 06, 07 Y 08
-- IMAGENESPRODUCTO, INVENTARIOS Y CARRITOS
-- TOTAL: 12 FUNCIONES
-- ============================================================

BEGIN;

-- ============================================================
-- 06. IMAGENES DE PRODUCTOS
-- ============================================================

-- 06.1 LISTAR IMAGENES POR PRODUCTO

CREATE OR REPLACE FUNCTION public.sp_imagenesproducto_listarporproducto(
    p_productoid INTEGER
)
RETURNS TABLE (
    imagenid INTEGER,
    productoid INTEGER,
    imagenurl VARCHAR(500),
    esprincipal BOOLEAN,
    orden INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ip.imagenid,
        ip.productoid,
        ip.imagenurl,
        ip.esprincipal,
        ip.orden
    FROM public.imagenesproducto ip
    WHERE ip.productoid = p_productoid
    ORDER BY
        ip.esprincipal DESC,
        ip.orden,
        ip.imagenid;
END;
$$;


-- 06.2 AGREGAR IMAGEN

CREATE OR REPLACE FUNCTION public.sp_imagenesproducto_agregar(
    p_productoid INTEGER,
    p_vendedorid INTEGER,
    p_imagenurl VARCHAR(500),
    p_esprincipal BOOLEAN DEFAULT FALSE,
    p_orden INTEGER DEFAULT 0
)
RETURNS TABLE (
    imagenid INTEGER,
    productoid INTEGER,
    imagenurl VARCHAR(500),
    esprincipal BOOLEAN,
    orden INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_imagenurl VARCHAR(500);
    v_imagenid INTEGER;
BEGIN
    v_imagenurl := NULLIF(TRIM(p_imagenurl), '');

    IF v_imagenurl IS NULL THEN
        RAISE EXCEPTION
            'La ruta de la imagen es obligatoria.';
    END IF;

    IF p_orden IS NULL OR p_orden < 0 THEN
        RAISE EXCEPTION
            'El orden no puede ser negativo.';
    END IF;

    -- Bloqueamos el producto para serializar cambios
    -- de imagen principal.
    PERFORM 1
    FROM public.productos p
    WHERE p.productoid = p_productoid
      AND p.vendedorid = p_vendedorid
      AND p.activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Producto no encontrado, inactivo o de otro vendedor.';
    END IF;

    IF p_esprincipal = TRUE THEN
        UPDATE public.imagenesproducto ip
        SET esprincipal = FALSE
        WHERE ip.productoid = p_productoid
          AND ip.esprincipal = TRUE;
    END IF;

    INSERT INTO public.imagenesproducto (
        productoid,
        imagenurl,
        esprincipal,
        orden
    )
    VALUES (
        p_productoid,
        v_imagenurl,
        p_esprincipal,
        p_orden
    )
    RETURNING public.imagenesproducto.imagenid
    INTO v_imagenid;

    RETURN QUERY
    SELECT
        ip.imagenid,
        ip.productoid,
        ip.imagenurl,
        ip.esprincipal,
        ip.orden
    FROM public.imagenesproducto ip
    WHERE ip.imagenid = v_imagenid;
END;
$$;


-- 06.3 ESTABLECER IMAGEN PRINCIPAL

CREATE OR REPLACE FUNCTION public.sp_imagenesproducto_establecerprincipal(
    p_imagenid INTEGER,
    p_vendedorid INTEGER
)
RETURNS TABLE (
    imagenid INTEGER,
    productoid INTEGER,
    imagenurl VARCHAR(500),
    esprincipal BOOLEAN,
    orden INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_productoid INTEGER;
BEGIN
    -- Identificar el producto y bloquearlo.
    SELECT p.productoid
    INTO v_productoid
    FROM public.productos p
    INNER JOIN public.imagenesproducto ip
        ON ip.productoid = p.productoid
    WHERE ip.imagenid = p_imagenid
      AND p.vendedorid = p_vendedorid
      AND p.activo = TRUE
    FOR UPDATE OF p;

    IF v_productoid IS NULL THEN
        RAISE EXCEPTION
            'Imagen no encontrada o sin permiso para modificarla.';
    END IF;

    UPDATE public.imagenesproducto ip
    SET esprincipal = FALSE
    WHERE ip.productoid = v_productoid
      AND ip.esprincipal = TRUE;

    UPDATE public.imagenesproducto ip
    SET esprincipal = TRUE
    WHERE ip.imagenid = p_imagenid;

    RETURN QUERY
    SELECT *
    FROM public.sp_imagenesproducto_listarporproducto(v_productoid);
END;
$$;


-- 06.4 ELIMINAR IMAGEN

CREATE OR REPLACE FUNCTION public.sp_imagenesproducto_eliminar(
    p_imagenid INTEGER,
    p_vendedorid INTEGER
)
RETURNS TABLE (
    mensaje TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    DELETE FROM public.imagenesproducto ip
    USING public.productos p
    WHERE p.productoid = ip.productoid
      AND ip.imagenid = p_imagenid
      AND p.vendedorid = p_vendedorid;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'Imagen no encontrada o sin permiso para eliminarla.';
    END IF;

    RETURN QUERY
    SELECT 'Imagen eliminada correctamente.'::TEXT;
END;
$$;


-- ============================================================
-- 07. INVENTARIOS
-- ============================================================

-- 07.1 CONSULTAR INVENTARIO POR PRODUCTO

CREATE OR REPLACE FUNCTION public.sp_inventarios_consultarporproducto(
    p_productoid INTEGER
)
RETURNS TABLE (
    inventarioid INTEGER,
    productoid INTEGER,
    producto VARCHAR(150),
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    cantidadtotal INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.inventarioid,
        i.productoid,
        p.nombre,
        i.cantidaddisponible,
        i.cantidadreservada,
        i.cantidaddisponible + i.cantidadreservada
    FROM public.inventarios i
    INNER JOIN public.productos p
        ON p.productoid = i.productoid
    WHERE i.productoid = p_productoid;
END;
$$;


-- 07.2 AGREGAR EXISTENCIAS

CREATE OR REPLACE FUNCTION public.sp_inventarios_agregarexistencias(
    p_productoid INTEGER,
    p_vendedorid INTEGER,
    p_cantidad INTEGER
)
RETURNS TABLE (
    inventarioid INTEGER,
    productoid INTEGER,
    producto VARCHAR(150),
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    cantidadtotal INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION
            'La cantidad debe ser positiva.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.productos p
        WHERE p.productoid = p_productoid
          AND p.vendedorid = p_vendedorid
          AND p.activo = TRUE
    ) THEN
        RAISE EXCEPTION
            'Producto inexistente, inactivo o ajeno al vendedor.';
    END IF;

    UPDATE public.inventarios i
    SET cantidaddisponible =
        i.cantidaddisponible + p_cantidad
    WHERE i.productoid = p_productoid
      AND i.cantidaddisponible <= 2147483647 - p_cantidad;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'Inventario inexistente o cantidad fuera de rango.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_inventarios_consultarporproducto(p_productoid);
END;
$$;


-- 07.3 RESERVAR INVENTARIO

CREATE OR REPLACE FUNCTION public.sp_inventarios_reservar(
    p_productoid INTEGER,
    p_cantidad INTEGER
)
RETURNS TABLE (
    inventarioid INTEGER,
    productoid INTEGER,
    producto VARCHAR(150),
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    cantidadtotal INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION
            'La cantidad debe ser positiva.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.productos p
        INNER JOIN public.vendedores v
            ON v.vendedorid = p.vendedorid
        INNER JOIN public.categorias c
            ON c.categoriaid = p.categoriaid
        WHERE p.productoid = p_productoid
          AND p.activo = TRUE
          AND v.activo = TRUE
    ) THEN
        RAISE EXCEPTION
            'El producto no esta disponible para la venta.';
    END IF;

    UPDATE public.inventarios i
    SET
        cantidaddisponible =
            i.cantidaddisponible - p_cantidad,
        cantidadreservada =
            i.cantidadreservada + p_cantidad
    WHERE i.productoid = p_productoid
      AND i.cantidaddisponible >= p_cantidad
      AND i.cantidadreservada <= 2147483647 - p_cantidad;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'Existencias insuficientes para reservar.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_inventarios_consultarporproducto(p_productoid);
END;
$$;


-- 07.4 LIBERAR RESERVA

CREATE OR REPLACE FUNCTION public.sp_inventarios_liberarreserva(
    p_productoid INTEGER,
    p_cantidad INTEGER
)
RETURNS TABLE (
    inventarioid INTEGER,
    productoid INTEGER,
    producto VARCHAR(150),
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    cantidadtotal INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION
            'La cantidad debe ser positiva.';
    END IF;

    UPDATE public.inventarios i
    SET
        cantidaddisponible =
            i.cantidaddisponible + p_cantidad,
        cantidadreservada =
            i.cantidadreservada - p_cantidad
    WHERE i.productoid = p_productoid
      AND i.cantidadreservada >= p_cantidad
      AND i.cantidaddisponible <= 2147483647 - p_cantidad;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'Reserva insuficiente o inventario inexistente.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_inventarios_consultarporproducto(p_productoid);
END;
$$;


-- 07.5 CONFIRMAR SALIDA

CREATE OR REPLACE FUNCTION public.sp_inventarios_confirmarsalida(
    p_productoid INTEGER,
    p_cantidad INTEGER
)
RETURNS TABLE (
    inventarioid INTEGER,
    productoid INTEGER,
    producto VARCHAR(150),
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    cantidadtotal INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION
            'La cantidad debe ser positiva.';
    END IF;

    UPDATE public.inventarios i
    SET cantidadreservada =
        i.cantidadreservada - p_cantidad
    WHERE i.productoid = p_productoid
      AND i.cantidadreservada >= p_cantidad;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'Reserva insuficiente o inventario inexistente.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_inventarios_consultarporproducto(p_productoid);
END;
$$;


-- ============================================================
-- 08. CARRITOS
-- ============================================================

-- 08.1 OBTENER O CREAR CARRITO

CREATE OR REPLACE FUNCTION public.sp_carritos_obtenerocrear(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    carritoid INTEGER,
    usuarioid INTEGER,
    fechacreacion TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_carritoid INTEGER;
BEGIN
    -- Bloqueamos el usuario para serializar
    -- la creacion de su carrito.
    PERFORM 1
    FROM public.usuarios u
    WHERE u.usuarioid = p_usuarioid
      AND u.activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Usuario inexistente o inactivo.';
    END IF;

    SELECT c.carritoid
    INTO v_carritoid
    FROM public.carritos c
    WHERE c.usuarioid = p_usuarioid;

    IF v_carritoid IS NULL THEN
        INSERT INTO public.carritos (
            usuarioid
        )
        VALUES (
            p_usuarioid
        )
        RETURNING public.carritos.carritoid
        INTO v_carritoid;
    END IF;

    RETURN QUERY
    SELECT
        c.carritoid,
        c.usuarioid,
        c.fechacreacion
    FROM public.carritos c
    WHERE c.carritoid = v_carritoid;
END;
$$;


-- 08.2 CONSULTAR CARRITO POR USUARIO

CREATE OR REPLACE FUNCTION public.sp_carritos_consultarporusuario(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    carritoid INTEGER,
    usuarioid INTEGER,
    fechacreacion TIMESTAMP,
    productosdistintos BIGINT,
    unidades BIGINT,
    subtotalestimado NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.carritoid,
        c.usuarioid,
        c.fechacreacion,
        COUNT(dc.detallecarritoid),
        COALESCE(SUM(dc.cantidad), 0)::BIGINT,
        COALESCE(
            SUM(dc.cantidad::NUMERIC(19,2) * p.precio),
            0
        )
    FROM public.carritos c
    LEFT JOIN public.detallescarrito dc
        ON dc.carritoid = c.carritoid
    LEFT JOIN public.productos p
        ON p.productoid = dc.productoid
    WHERE c.usuarioid = p_usuarioid
    GROUP BY
        c.carritoid,
        c.usuarioid,
        c.fechacreacion;
END;
$$;


-- 08.3 VACIAR CARRITO

CREATE OR REPLACE FUNCTION public.sp_carritos_vaciar(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    carritoid INTEGER,
    usuarioid INTEGER,
    fechacreacion TIMESTAMP,
    productosdistintos BIGINT,
    unidades BIGINT,
    subtotalestimado NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_carritoid INTEGER;
BEGIN
    SELECT c.carritoid
    INTO v_carritoid
    FROM public.carritos c
    WHERE c.usuarioid = p_usuarioid;

    IF v_carritoid IS NULL THEN
        RAISE EXCEPTION
            'El usuario no tiene carrito.';
    END IF;

    DELETE FROM public.detallescarrito dc
    WHERE dc.carritoid = v_carritoid;

    RETURN QUERY
    SELECT *
    FROM public.sp_carritos_consultarporusuario(p_usuarioid);
END;
$$;

COMMIT;
