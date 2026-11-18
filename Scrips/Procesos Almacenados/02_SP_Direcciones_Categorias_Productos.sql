
-- ============================================================
-- CLICKMARKET - POSTGRESQL 18 / NEON
-- MODULOS: DIRECCIONES, CATEGORIAS Y PRODUCTOS
-- TOTAL: 14 FUNCIONES
-- ============================================================

BEGIN;

-- ============================================================
-- 1. DIRECCIONES
-- ============================================================

-- 1.1 AGREGAR DIRECCION

CREATE OR REPLACE FUNCTION public.sp_direcciones_agregar(
    p_usuarioid INTEGER,
    p_provincia VARCHAR(100),
    p_canton VARCHAR(100),
    p_distrito VARCHAR(100),
    p_detalle VARCHAR(300),
    p_principal BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    direccionid INTEGER,
    usuarioid INTEGER,
    provincia VARCHAR(100),
    canton VARCHAR(100),
    distrito VARCHAR(100),
    detalle VARCHAR(300),
    principal BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_direccionid INTEGER;
BEGIN
    IF NULLIF(TRIM(p_provincia), '') IS NULL
       OR NULLIF(TRIM(p_canton), '') IS NULL
       OR NULLIF(TRIM(p_distrito), '') IS NULL
       OR NULLIF(TRIM(p_detalle), '') IS NULL
    THEN
        RAISE EXCEPTION
            'Todos los campos de direccion son obligatorios.';
    END IF;

    -- Bloqueamos el usuario para serializar cambios
    -- de direccion principal.
    PERFORM 1
    FROM public.usuarios u
    WHERE u.usuarioid = p_usuarioid
      AND u.activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'El usuario no existe o esta inactivo.';
    END IF;

    IF p_principal = TRUE THEN
        UPDATE public.direcciones d
        SET principal = FALSE
        WHERE d.usuarioid = p_usuarioid
          AND d.principal = TRUE;
    END IF;

    INSERT INTO public.direcciones (
        usuarioid,
        provincia,
        canton,
        distrito,
        detalle,
        principal
    )
    VALUES (
        p_usuarioid,
        TRIM(p_provincia),
        TRIM(p_canton),
        TRIM(p_distrito),
        TRIM(p_detalle),
        p_principal
    )
    RETURNING public.direcciones.direccionid
    INTO v_direccionid;

    RETURN QUERY
    SELECT
        d.direccionid,
        d.usuarioid,
        d.provincia,
        d.canton,
        d.distrito,
        d.detalle,
        d.principal
    FROM public.direcciones d
    WHERE d.direccionid = v_direccionid;
END;
$$;


-- 1.2 LISTAR DIRECCIONES POR USUARIO

CREATE OR REPLACE FUNCTION public.sp_direcciones_listarporusuario(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    direccionid INTEGER,
    usuarioid INTEGER,
    provincia VARCHAR(100),
    canton VARCHAR(100),
    distrito VARCHAR(100),
    detalle VARCHAR(300),
    principal BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.direccionid,
        d.usuarioid,
        d.provincia,
        d.canton,
        d.distrito,
        d.detalle,
        d.principal
    FROM public.direcciones d
    WHERE d.usuarioid = p_usuarioid
    ORDER BY d.principal DESC, d.direccionid;
END;
$$;


-- 1.3 ACTUALIZAR DIRECCION

CREATE OR REPLACE FUNCTION public.sp_direcciones_actualizar(
    p_direccionid INTEGER,
    p_usuarioid INTEGER,
    p_provincia VARCHAR(100),
    p_canton VARCHAR(100),
    p_distrito VARCHAR(100),
    p_detalle VARCHAR(300),
    p_principal BOOLEAN
)
RETURNS TABLE (
    direccionid INTEGER,
    usuarioid INTEGER,
    provincia VARCHAR(100),
    canton VARCHAR(100),
    distrito VARCHAR(100),
    detalle VARCHAR(300),
    principal BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NULLIF(TRIM(p_provincia), '') IS NULL
       OR NULLIF(TRIM(p_canton), '') IS NULL
       OR NULLIF(TRIM(p_distrito), '') IS NULL
       OR NULLIF(TRIM(p_detalle), '') IS NULL
    THEN
        RAISE EXCEPTION
            'Todos los campos de direccion son obligatorios.';
    END IF;

    PERFORM 1
    FROM public.usuarios u
    WHERE u.usuarioid = p_usuarioid
      AND u.activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'El usuario no existe o esta inactivo.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.direcciones d
        WHERE d.direccionid = p_direccionid
          AND d.usuarioid = p_usuarioid
    ) THEN
        RAISE EXCEPTION
            'La direccion no pertenece al usuario.';
    END IF;

    IF p_principal = TRUE THEN
        UPDATE public.direcciones d
        SET principal = FALSE
        WHERE d.usuarioid = p_usuarioid
          AND d.direccionid <> p_direccionid
          AND d.principal = TRUE;
    END IF;

    UPDATE public.direcciones d
    SET
        provincia = TRIM(p_provincia),
        canton = TRIM(p_canton),
        distrito = TRIM(p_distrito),
        detalle = TRIM(p_detalle),
        principal = p_principal
    WHERE d.direccionid = p_direccionid
      AND d.usuarioid = p_usuarioid;

    RETURN QUERY
    SELECT
        d.direccionid,
        d.usuarioid,
        d.provincia,
        d.canton,
        d.distrito,
        d.detalle,
        d.principal
    FROM public.direcciones d
    WHERE d.direccionid = p_direccionid;
END;
$$;


-- 1.4 ELIMINAR DIRECCION

CREATE OR REPLACE FUNCTION public.sp_direcciones_eliminar(
    p_direccionid INTEGER,
    p_usuarioid INTEGER
)
RETURNS TABLE (
    mensaje TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM 1
    FROM public.usuarios u
    WHERE u.usuarioid = p_usuarioid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'El usuario no existe.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.direcciones d
        WHERE d.direccionid = p_direccionid
          AND d.usuarioid = p_usuarioid
    ) THEN
        RAISE EXCEPTION
            'La direccion no existe o no pertenece al usuario.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.pedidos p
        WHERE p.direccionid = p_direccionid
    ) THEN
        RAISE EXCEPTION
            'No se puede eliminar una direccion utilizada en pedidos.';
    END IF;

    DELETE FROM public.direcciones d
    WHERE d.direccionid = p_direccionid
      AND d.usuarioid = p_usuarioid;

    RETURN QUERY
    SELECT 'Direccion eliminada correctamente.'::TEXT;
END;
$$;


-- ============================================================
-- 2. CATEGORIAS
-- ============================================================

-- 2.1 CREAR CATEGORIA

CREATE OR REPLACE FUNCTION public.sp_categorias_crear(
    p_nombre VARCHAR(100),
    p_descripcion VARCHAR(300) DEFAULT NULL
)
RETURNS TABLE (
    categoriaid INTEGER,
    nombre VARCHAR(100),
    descripcion VARCHAR(300)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre VARCHAR(100);
    v_categoriaid INTEGER;
BEGIN
    v_nombre := NULLIF(TRIM(p_nombre), '');

    IF v_nombre IS NULL THEN
        RAISE EXCEPTION
            'El nombre de la categoria es obligatorio.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.categorias c
        WHERE c.nombre = v_nombre
    ) THEN
        RAISE EXCEPTION
            'Ya existe una categoria con ese nombre.';
    END IF;

    INSERT INTO public.categorias (
        nombre,
        descripcion
    )
    VALUES (
        v_nombre,
        p_descripcion
    )
    RETURNING public.categorias.categoriaid
    INTO v_categoriaid;

    RETURN QUERY
    SELECT
        c.categoriaid,
        c.nombre,
        c.descripcion
    FROM public.categorias c
    WHERE c.categoriaid = v_categoriaid;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION
            'Ya existe una categoria con ese nombre.'
            USING ERRCODE = '23505';
END;
$$;


-- 2.2 CONSULTAR CATEGORIA POR ID

CREATE OR REPLACE FUNCTION public.sp_categorias_consultarporid(
    p_categoriaid INTEGER
)
RETURNS TABLE (
    categoriaid INTEGER,
    nombre VARCHAR(100),
    descripcion VARCHAR(300)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.categoriaid,
        c.nombre,
        c.descripcion
    FROM public.categorias c
    WHERE c.categoriaid = p_categoriaid;
END;
$$;


-- 2.3 LISTAR CATEGORIAS

CREATE OR REPLACE FUNCTION public.sp_categorias_listar()
RETURNS TABLE (
    categoriaid INTEGER,
    nombre VARCHAR(100),
    descripcion VARCHAR(300)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.categoriaid,
        c.nombre,
        c.descripcion
    FROM public.categorias c
    ORDER BY c.nombre;
END;
$$;


-- 2.4 ACTUALIZAR CATEGORIA

CREATE OR REPLACE FUNCTION public.sp_categorias_actualizar(
    p_categoriaid INTEGER,
    p_nombre VARCHAR(100),
    p_descripcion VARCHAR(300) DEFAULT NULL
)
RETURNS TABLE (
    categoriaid INTEGER,
    nombre VARCHAR(100),
    descripcion VARCHAR(300)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre VARCHAR(100);
    v_filas INTEGER;
BEGIN
    v_nombre := NULLIF(TRIM(p_nombre), '');

    IF v_nombre IS NULL THEN
        RAISE EXCEPTION
            'El nombre de la categoria es obligatorio.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.categorias c
        WHERE c.categoriaid = p_categoriaid
    ) THEN
        RAISE EXCEPTION
            'La categoria no existe.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.categorias c
        WHERE c.nombre = v_nombre
          AND c.categoriaid <> p_categoriaid
    ) THEN
        RAISE EXCEPTION
            'El nombre pertenece a otra categoria.';
    END IF;

    UPDATE public.categorias c
    SET
        nombre = v_nombre,
        descripcion = p_descripcion
    WHERE c.categoriaid = p_categoriaid;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'La categoria no existe.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_categorias_consultarporid(p_categoriaid);

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION
            'El nombre pertenece a otra categoria.'
            USING ERRCODE = '23505';
END;
$$;


-- ============================================================
-- 3. PRODUCTOS
-- ============================================================

-- 3.1 CONSULTAR PRODUCTO POR ID

CREATE OR REPLACE FUNCTION public.sp_productos_consultarporid(
    p_productoid INTEGER
)
RETURNS TABLE (
    productoid INTEGER,
    vendedorid INTEGER,
    vendedor VARCHAR(150),
    categoriaid INTEGER,
    categoria VARCHAR(100),
    nombre VARCHAR(150),
    descripcion TEXT,
    precio NUMERIC(12,2),
    fechacreacion TIMESTAMP,
    activo BOOLEAN,
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    imagenprincipal VARCHAR(500)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.productoid,
        p.vendedorid,
        v.nombrecomercial,
        p.categoriaid,
        c.nombre,
        p.nombre,
        p.descripcion,
        p.precio,
        p.fechacreacion,
        p.activo,
        i.cantidaddisponible,
        i.cantidadreservada,
        (
            SELECT ip.imagenurl
            FROM public.imagenesproducto ip
            WHERE ip.productoid = p.productoid
            ORDER BY
                ip.esprincipal DESC,
                ip.orden,
                ip.imagenid
            LIMIT 1
        )
    FROM public.productos p
    INNER JOIN public.vendedores v
        ON v.vendedorid = p.vendedorid
    INNER JOIN public.categorias c
        ON c.categoriaid = p.categoriaid
    LEFT JOIN public.inventarios i
        ON i.productoid = p.productoid
    WHERE p.productoid = p_productoid;
END;
$$;


-- 3.2 CREAR PRODUCTO

CREATE OR REPLACE FUNCTION public.sp_productos_crear(
    p_vendedorid INTEGER,
    p_categoriaid INTEGER,
    p_nombre VARCHAR(150),
    p_descripcion TEXT,
    p_precio NUMERIC(12,2)
)
RETURNS TABLE (
    productoid INTEGER,
    vendedorid INTEGER,
    vendedor VARCHAR(150),
    categoriaid INTEGER,
    categoria VARCHAR(100),
    nombre VARCHAR(150),
    descripcion TEXT,
    precio NUMERIC(12,2),
    fechacreacion TIMESTAMP,
    activo BOOLEAN,
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    imagenprincipal VARCHAR(500)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre VARCHAR(150);
    v_productoid INTEGER;
BEGIN
    v_nombre := NULLIF(TRIM(p_nombre), '');

    IF v_nombre IS NULL THEN
        RAISE EXCEPTION
            'El nombre del producto es obligatorio.';
    END IF;

    IF p_precio IS NULL OR p_precio < 0 THEN
        RAISE EXCEPTION
            'El precio debe ser mayor o igual a cero.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.vendedores v
        LEFT JOIN public.usuarios u
            ON u.usuarioid = v.usuarioid
        WHERE v.vendedorid = p_vendedorid
          AND v.activo = TRUE
          AND (
              v.esclickmarket = TRUE
              OR u.activo = TRUE
          )
    ) THEN
        RAISE EXCEPTION
            'El vendedor no existe o esta inactivo.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.categorias c
        WHERE c.categoriaid = p_categoriaid
    ) THEN
        RAISE EXCEPTION
            'La categoria no existe.';
    END IF;

    -- La insercion del producto y su inventario
    -- forma una unica operacion atomica.

    INSERT INTO public.productos (
        vendedorid,
        categoriaid,
        nombre,
        descripcion,
        precio
    )
    VALUES (
        p_vendedorid,
        p_categoriaid,
        v_nombre,
        p_descripcion,
        p_precio
    )
    RETURNING public.productos.productoid
    INTO v_productoid;

    INSERT INTO public.inventarios (
        productoid,
        cantidaddisponible,
        cantidadreservada
    )
    VALUES (
        v_productoid,
        0,
        0
    );

    RETURN QUERY
    SELECT *
    FROM public.sp_productos_consultarporid(v_productoid);
END;
$$;


-- 3.3 LISTAR PRODUCTOS

CREATE OR REPLACE FUNCTION public.sp_productos_listar(
    p_categoriaid INTEGER DEFAULT NULL,
    p_vendedorid INTEGER DEFAULT NULL,
    p_busqueda VARCHAR(150) DEFAULT NULL,
    p_soloactivos BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    productoid INTEGER,
    vendedorid INTEGER,
    vendedor VARCHAR(150),
    categoriaid INTEGER,
    categoria VARCHAR(100),
    nombre VARCHAR(150),
    descripcion TEXT,
    precio NUMERIC(12,2),
    fechacreacion TIMESTAMP,
    activo BOOLEAN,
    cantidaddisponible INTEGER,
    imagenprincipal VARCHAR(500)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.productoid,
        p.vendedorid,
        v.nombrecomercial,
        p.categoriaid,
        c.nombre,
        p.nombre,
        p.descripcion,
        p.precio,
        p.fechacreacion,
        p.activo,
        i.cantidaddisponible,
        (
            SELECT ip.imagenurl
            FROM public.imagenesproducto ip
            WHERE ip.productoid = p.productoid
            ORDER BY
                ip.esprincipal DESC,
                ip.orden,
                ip.imagenid
            LIMIT 1
        )
    FROM public.productos p
    INNER JOIN public.vendedores v
        ON v.vendedorid = p.vendedorid
    INNER JOIN public.categorias c
        ON c.categoriaid = p.categoriaid
    LEFT JOIN public.inventarios i
        ON i.productoid = p.productoid
    WHERE
        (
            p_categoriaid IS NULL
            OR p.categoriaid = p_categoriaid
        )
        AND (
            p_vendedorid IS NULL
            OR p.vendedorid = p_vendedorid
        )
        AND (
            p_busqueda IS NULL
            OR p.nombre LIKE '%' || p_busqueda || '%'
        )
        AND (
            p_soloactivos = FALSE
            OR (
                p.activo = TRUE
                AND v.activo = TRUE
            )
        )
    ORDER BY
        p.fechacreacion DESC,
        p.productoid DESC;
END;
$$;


-- 3.4 ACTUALIZAR PRODUCTO

CREATE OR REPLACE FUNCTION public.sp_productos_actualizar(
    p_productoid INTEGER,
    p_vendedorid INTEGER,
    p_categoriaid INTEGER,
    p_nombre VARCHAR(150),
    p_descripcion TEXT,
    p_precio NUMERIC(12,2)
)
RETURNS TABLE (
    productoid INTEGER,
    vendedorid INTEGER,
    vendedor VARCHAR(150),
    categoriaid INTEGER,
    categoria VARCHAR(100),
    nombre VARCHAR(150),
    descripcion TEXT,
    precio NUMERIC(12,2),
    fechacreacion TIMESTAMP,
    activo BOOLEAN,
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    imagenprincipal VARCHAR(500)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre VARCHAR(150);
    v_filas INTEGER;
BEGIN
    v_nombre := NULLIF(TRIM(p_nombre), '');

    IF v_nombre IS NULL THEN
        RAISE EXCEPTION
            'El nombre del producto es obligatorio.';
    END IF;

    IF p_precio IS NULL OR p_precio < 0 THEN
        RAISE EXCEPTION
            'El precio debe ser mayor o igual a cero.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.productos p
        WHERE p.productoid = p_productoid
          AND p.vendedorid = p_vendedorid
          AND p.activo = TRUE
    ) THEN
        RAISE EXCEPTION
            'El producto no existe, esta inactivo o no pertenece al vendedor.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.categorias c
        WHERE c.categoriaid = p_categoriaid
    ) THEN
        RAISE EXCEPTION
            'La categoria no existe.';
    END IF;

    UPDATE public.productos p
    SET
        categoriaid = p_categoriaid,
        nombre = v_nombre,
        descripcion = p_descripcion,
        precio = p_precio
    WHERE p.productoid = p_productoid
      AND p.vendedorid = p_vendedorid
      AND p.activo = TRUE;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'El producto no existe, esta inactivo o no pertenece al vendedor.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_productos_consultarporid(p_productoid);
END;
$$;


-- 3.5 DESACTIVAR PRODUCTO

CREATE OR REPLACE FUNCTION public.sp_productos_desactivar(
    p_productoid INTEGER,
    p_vendedorid INTEGER
)
RETURNS TABLE (
    productoid INTEGER,
    vendedorid INTEGER,
    vendedor VARCHAR(150),
    categoriaid INTEGER,
    categoria VARCHAR(100),
    nombre VARCHAR(150),
    descripcion TEXT,
    precio NUMERIC(12,2),
    fechacreacion TIMESTAMP,
    activo BOOLEAN,
    cantidaddisponible INTEGER,
    cantidadreservada INTEGER,
    imagenprincipal VARCHAR(500)
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.productos p
        WHERE p.productoid = p_productoid
          AND p.vendedorid = p_vendedorid
    ) THEN
        RAISE EXCEPTION
            'El producto no existe o no pertenece al vendedor.';
    END IF;

    UPDATE public.productos p
    SET activo = FALSE
    WHERE p.productoid = p_productoid
      AND p.vendedorid = p_vendedorid;

    RETURN QUERY
    SELECT *
    FROM public.sp_productos_consultarporid(p_productoid);
END;
$$;

COMMIT;
