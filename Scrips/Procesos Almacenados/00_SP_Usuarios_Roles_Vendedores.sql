
-- ============================================================
-- CLICKMARKET - POSTGRESQL 18 / NEON
-- MODULOS: USUARIOS, ROLES Y VENDEDORES
-- ============================================================

BEGIN;

-- ============================================================
-- 1. USUARIOS
-- ============================================================

-- 1.1 CONSULTAR USUARIO POR ID

CREATE OR REPLACE FUNCTION public.sp_usuarios_consultarporid(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    usuarioid INTEGER,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150),
    rolid INTEGER,
    rol VARCHAR(30),
    fecharegistro TIMESTAMP,
    activo BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.usuarioid,
        u.nombre,
        u.apellido,
        u.correo,
        u.rolid,
        r.nombre,
        u.fecharegistro,
        u.activo
    FROM public.usuarios u
    INNER JOIN public.roles r
        ON r.rolid = u.rolid
    WHERE u.usuarioid = p_usuarioid;
END;
$$;


-- 1.2 CONSULTAR USUARIO POR CORREO

CREATE OR REPLACE FUNCTION public.sp_usuarios_consultarporcorreo(
    p_correo VARCHAR(150)
)
RETURNS TABLE (
    usuarioid INTEGER,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150),
    contrasenahash VARCHAR(255),
    rolid INTEGER,
    rol VARCHAR(30),
    activo BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.usuarioid,
        u.nombre,
        u.apellido,
        u.correo,
        u.contrasenahash,
        u.rolid,
        r.nombre,
        u.activo
    FROM public.usuarios u
    INNER JOIN public.roles r
        ON r.rolid = u.rolid
    WHERE u.correo = TRIM(p_correo);
END;
$$;


-- 1.3 REGISTRAR USUARIO

CREATE OR REPLACE FUNCTION public.sp_usuarios_registrar(
    p_nombre VARCHAR(100),
    p_apellido VARCHAR(100),
    p_correo VARCHAR(150),
    p_contrasenahash VARCHAR(255)
)
RETURNS TABLE (
    usuarioid INTEGER,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150),
    rolid INTEGER,
    rol VARCHAR(30),
    fecharegistro TIMESTAMP,
    activo BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rolid INTEGER;
    v_usuarioid INTEGER;
BEGIN
    IF NULLIF(TRIM(p_nombre), '') IS NULL
       OR NULLIF(TRIM(p_apellido), '') IS NULL
       OR NULLIF(TRIM(p_correo), '') IS NULL
       OR NULLIF(TRIM(p_contrasenahash), '') IS NULL
    THEN
        RAISE EXCEPTION
            'Los campos obligatorios no pueden estar vacios.'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT r.rolid
    INTO v_rolid
    FROM public.roles r
    WHERE r.nombre = 'Comprador';

    IF v_rolid IS NULL THEN
        RAISE EXCEPTION
            'El rol Comprador no existe.'
            USING ERRCODE = 'P0001';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.usuarios u
        WHERE u.correo = TRIM(p_correo)
    ) THEN
        RAISE EXCEPTION
            'El correo ya esta registrado.'
            USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.usuarios (
        rolid,
        nombre,
        apellido,
        correo,
        contrasenahash
    )
    VALUES (
        v_rolid,
        TRIM(p_nombre),
        TRIM(p_apellido),
        TRIM(p_correo),
        p_contrasenahash
    )
    RETURNING public.usuarios.usuarioid
    INTO v_usuarioid;

    RETURN QUERY
    SELECT *
    FROM public.sp_usuarios_consultarporid(v_usuarioid);

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION
            'El correo ya esta registrado.'
            USING ERRCODE = '23505';
END;
$$;


-- 1.4 ACTUALIZAR USUARIO

CREATE OR REPLACE FUNCTION public.sp_usuarios_actualizar(
    p_usuarioid INTEGER,
    p_nombre VARCHAR(100),
    p_apellido VARCHAR(100),
    p_correo VARCHAR(150)
)
RETURNS TABLE (
    usuarioid INTEGER,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150),
    rolid INTEGER,
    rol VARCHAR(30),
    fecharegistro TIMESTAMP,
    activo BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.usuarios u
        WHERE u.usuarioid = p_usuarioid
          AND u.activo = TRUE
    ) THEN
        RAISE EXCEPTION
            'El usuario no existe o esta inactivo.'
            USING ERRCODE = 'P0001';
    END IF;

    IF NULLIF(TRIM(p_nombre), '') IS NULL
       OR NULLIF(TRIM(p_apellido), '') IS NULL
       OR NULLIF(TRIM(p_correo), '') IS NULL
    THEN
        RAISE EXCEPTION
            'Los campos obligatorios no pueden estar vacios.'
            USING ERRCODE = 'P0001';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.usuarios u
        WHERE u.correo = TRIM(p_correo)
          AND u.usuarioid <> p_usuarioid
    ) THEN
        RAISE EXCEPTION
            'El correo ya pertenece a otro usuario.'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.usuarios u
    SET
        nombre = TRIM(p_nombre),
        apellido = TRIM(p_apellido),
        correo = TRIM(p_correo)
    WHERE u.usuarioid = p_usuarioid
      AND u.activo = TRUE;

    RETURN QUERY
    SELECT *
    FROM public.sp_usuarios_consultarporid(p_usuarioid);

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION
            'El correo ya pertenece a otro usuario.'
            USING ERRCODE = '23505';
END;
$$;


-- 1.5 DESACTIVAR USUARIO

CREATE OR REPLACE FUNCTION public.sp_usuarios_desactivar(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    usuarioid INTEGER,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150),
    rolid INTEGER,
    rol VARCHAR(30),
    fecharegistro TIMESTAMP,
    activo BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.usuarios u
        WHERE u.usuarioid = p_usuarioid
    ) THEN
        RAISE EXCEPTION
            'El usuario no existe.'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.usuarios u
    SET activo = FALSE
    WHERE u.usuarioid = p_usuarioid;

    RETURN QUERY
    SELECT *
    FROM public.sp_usuarios_consultarporid(p_usuarioid);
END;
$$;


-- ============================================================
-- 2. ROLES
-- ============================================================

-- 2.1 LISTAR ROLES

CREATE OR REPLACE FUNCTION public.sp_roles_listar()
RETURNS TABLE (
    rolid INTEGER,
    nombre VARCHAR(30),
    descripcion VARCHAR(200)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.rolid,
        r.nombre,
        r.descripcion
    FROM public.roles r
    ORDER BY r.rolid;
END;
$$;


-- ============================================================
-- 3. VENDEDORES
-- ============================================================

-- 3.1 CONSULTAR VENDEDOR POR ID

CREATE OR REPLACE FUNCTION public.sp_vendedores_consultarporid(
    p_vendedorid INTEGER
)
RETURNS TABLE (
    vendedorid INTEGER,
    usuarioid INTEGER,
    nombrecomercial VARCHAR(150),
    descripcion VARCHAR(500),
    esclickmarket BOOLEAN,
    activo BOOLEAN,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.vendedorid,
        v.usuarioid,
        v.nombrecomercial,
        v.descripcion,
        v.esclickmarket,
        v.activo,
        u.nombre,
        u.apellido,
        u.correo
    FROM public.vendedores v
    LEFT JOIN public.usuarios u
        ON u.usuarioid = v.usuarioid
    WHERE v.vendedorid = p_vendedorid;
END;
$$;


-- 3.2 REGISTRAR VENDEDOR EXTERNO

CREATE OR REPLACE FUNCTION public.sp_vendedores_registrar(
    p_usuarioid INTEGER,
    p_nombrecomercial VARCHAR(150),
    p_descripcion VARCHAR(500) DEFAULT NULL
)
RETURNS TABLE (
    vendedorid INTEGER,
    usuarioid INTEGER,
    nombrecomercial VARCHAR(150),
    descripcion VARCHAR(500),
    esclickmarket BOOLEAN,
    activo BOOLEAN,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_vendedorid INTEGER;
BEGIN
    IF NULLIF(TRIM(p_nombrecomercial), '') IS NULL THEN
        RAISE EXCEPTION
            'El nombre comercial es obligatorio.'
            USING ERRCODE = 'P0001';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.usuarios u
        INNER JOIN public.roles r
            ON r.rolid = u.rolid
        WHERE u.usuarioid = p_usuarioid
          AND u.activo = TRUE
          AND r.nombre = 'Vendedor'
    ) THEN
        RAISE EXCEPTION
            'El usuario no existe, esta inactivo o no tiene rol Vendedor.'
            USING ERRCODE = 'P0001';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.vendedores v
        WHERE v.usuarioid = p_usuarioid
    ) THEN
        RAISE EXCEPTION
            'El usuario ya tiene un registro de vendedor.'
            USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.vendedores (
        usuarioid,
        nombrecomercial,
        descripcion,
        esclickmarket,
        activo
    )
    VALUES (
        p_usuarioid,
        TRIM(p_nombrecomercial),
        p_descripcion,
        FALSE,
        TRUE
    )
    RETURNING public.vendedores.vendedorid
    INTO v_vendedorid;

    RETURN QUERY
    SELECT *
    FROM public.sp_vendedores_consultarporid(v_vendedorid);

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION
            'El usuario ya tiene un registro de vendedor.'
            USING ERRCODE = '23505';
END;
$$;


-- 3.3 LISTAR VENDEDORES

CREATE OR REPLACE FUNCTION public.sp_vendedores_listar(
    p_soloactivos BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    vendedorid INTEGER,
    usuarioid INTEGER,
    nombrecomercial VARCHAR(150),
    descripcion VARCHAR(500),
    esclickmarket BOOLEAN,
    activo BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.vendedorid,
        v.usuarioid,
        v.nombrecomercial,
        v.descripcion,
        v.esclickmarket,
        v.activo
    FROM public.vendedores v
    WHERE p_soloactivos = FALSE
       OR v.activo = TRUE
    ORDER BY v.nombrecomercial;
END;
$$;


-- 3.4 ACTUALIZAR VENDEDOR

CREATE OR REPLACE FUNCTION public.sp_vendedores_actualizar(
    p_vendedorid INTEGER,
    p_nombrecomercial VARCHAR(150),
    p_descripcion VARCHAR(500) DEFAULT NULL
)
RETURNS TABLE (
    vendedorid INTEGER,
    usuarioid INTEGER,
    nombrecomercial VARCHAR(150),
    descripcion VARCHAR(500),
    esclickmarket BOOLEAN,
    activo BOOLEAN,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    IF NULLIF(TRIM(p_nombrecomercial), '') IS NULL THEN
        RAISE EXCEPTION
            'El nombre comercial es obligatorio.'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.vendedores v
    SET
        nombrecomercial = TRIM(p_nombrecomercial),
        descripcion = p_descripcion
    WHERE v.vendedorid = p_vendedorid
      AND v.activo = TRUE;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'El vendedor no existe o esta inactivo.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_vendedores_consultarporid(p_vendedorid);
END;
$$;


-- 3.5 DESACTIVAR VENDEDOR EXTERNO

CREATE OR REPLACE FUNCTION public.sp_vendedores_desactivar(
    p_vendedorid INTEGER
)
RETURNS TABLE (
    vendedorid INTEGER,
    usuarioid INTEGER,
    nombrecomercial VARCHAR(150),
    descripcion VARCHAR(500),
    esclickmarket BOOLEAN,
    activo BOOLEAN,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(150)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE public.vendedores v
    SET activo = FALSE
    WHERE v.vendedorid = p_vendedorid
      AND v.esclickmarket = FALSE;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 0 THEN
        RAISE EXCEPTION
            'Vendedor externo no encontrado.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.sp_vendedores_consultarporid(p_vendedorid);
END;
$$;


-- 3.6 OBTENER VENDEDOR POR USUARIO

CREATE OR REPLACE FUNCTION public.sp_vendedores_obtenerporusuario(
    p_usuarioid INTEGER
)
RETURNS TABLE (
    vendedorid INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT v.vendedorid
    FROM public.vendedores v
    INNER JOIN public.usuarios u
        ON u.usuarioid = v.usuarioid
    WHERE v.usuarioid = p_usuarioid
      AND v.activo = TRUE
      AND u.activo = TRUE;
END;
$$;


-- 3.7 VALIDAR PROPIETARIO DEL VENDEDOR

CREATE OR REPLACE FUNCTION public.sp_vendedores_validarpropietario(
    p_vendedorid INTEGER,
    p_usuarioid INTEGER
)
RETURNS TABLE (
    vendedorid INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT v.vendedorid
    FROM public.vendedores v
    INNER JOIN public.usuarios u
        ON u.usuarioid = v.usuarioid
    WHERE v.vendedorid = p_vendedorid
      AND v.usuarioid = p_usuarioid
      AND v.activo = TRUE
      AND u.activo = TRUE;
END;
$$;

COMMIT;
