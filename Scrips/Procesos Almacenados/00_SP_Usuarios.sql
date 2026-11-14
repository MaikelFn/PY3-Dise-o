USE ClickMarketDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Usuarios_Registrar
    @Nombre NVARCHAR(100),
    @Apellido NVARCHAR(100),
    @Correo NVARCHAR(150),
    @ContrasenaHash NVARCHAR(255),
    @RolID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(TRIM(@Nombre), N'') IS NULL
       OR NULLIF(TRIM(@Apellido), N'') IS NULL
       OR NULLIF(TRIM(@Correo), N'') IS NULL
       OR NULLIF(TRIM(@ContrasenaHash), N'') IS NULL
    BEGIN
        THROW 50001, 'Los campos obligatorios no pueden estar vacios.', 1;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Roles
        WHERE RolID = @RolID
    )
    BEGIN
        THROW 50002, 'El rol indicado no existe.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.Usuarios
        WHERE Correo = @Correo
    )
    BEGIN
        THROW 50003, 'El correo ya esta registrado.', 1;
    END;

    INSERT INTO dbo.Usuarios (
        RolID,
        Nombre,
        Apellido,
        Correo,
        ContrasenaHash
    )
    VALUES (
        @RolID,
        TRIM(@Nombre),
        TRIM(@Apellido),
        TRIM(@Correo),
        @ContrasenaHash
    );

    DECLARE @UsuarioID INT = SCOPE_IDENTITY();

    SELECT
        U.UsuarioID,
        U.Nombre,
        U.Apellido,
        U.Correo,
        R.Nombre AS Rol,
        U.FechaRegistro,
        U.Activo
    FROM dbo.Usuarios U
    INNER JOIN dbo.Roles R
        ON U.RolID = R.RolID
    WHERE U.UsuarioID = @UsuarioID;
END;
GO

-- ============================================
-- 2. CONSULTAR USUARIO POR ID
-- ============================================

CREATE OR ALTER PROCEDURE dbo.sp_Usuarios_ConsultarPorID
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        U.UsuarioID,
        U.Nombre,
        U.Apellido,
        U.Correo,
        U.RolID,
        R.Nombre AS Rol,
        U.FechaRegistro,
        U.Activo
    FROM dbo.Usuarios U
    INNER JOIN dbo.Roles R
        ON U.RolID = R.RolID
    WHERE U.UsuarioID = @UsuarioID;
END;
GO

-- ============================================
-- 3. CONSULTAR USUARIO POR CORREO
-- Uso interno para autenticacion
-- ============================================

CREATE OR ALTER PROCEDURE dbo.sp_Usuarios_ConsultarPorCorreo
    @Correo NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        U.UsuarioID,
        U.Nombre,
        U.Apellido,
        U.Correo,
        U.ContrasenaHash,
        U.RolID,
        R.Nombre AS Rol,
        U.Activo
    FROM dbo.Usuarios U
    INNER JOIN dbo.Roles R
        ON U.RolID = R.RolID
    WHERE U.Correo = TRIM(@Correo);
END;
GO

-- ============================================
-- 5. ACTUALIZAR USUARIO
-- ============================================

CREATE OR ALTER PROCEDURE dbo.sp_Usuarios_Actualizar
    @UsuarioID INT,
    @Nombre NVARCHAR(100),
    @Apellido NVARCHAR(100),
    @Correo NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Usuarios
        WHERE UsuarioID = @UsuarioID
          AND Activo = 1
    )
    BEGIN
        THROW 50004, 'El usuario no existe o esta inactivo.', 1;
    END;

    IF NULLIF(TRIM(@Nombre), N'') IS NULL
       OR NULLIF(TRIM(@Apellido), N'') IS NULL
       OR NULLIF(TRIM(@Correo), N'') IS NULL
    BEGIN
        THROW 50005, 'Los campos obligatorios no pueden estar vacios.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.Usuarios
        WHERE Correo = TRIM(@Correo)
          AND UsuarioID <> @UsuarioID
    )
    BEGIN
        THROW 50006, 'El correo ya pertenece a otro usuario.', 1;
    END;

    UPDATE dbo.Usuarios
    SET
        Nombre = TRIM(@Nombre),
        Apellido = TRIM(@Apellido),
        Correo = TRIM(@Correo)
    WHERE UsuarioID = @UsuarioID;

    EXEC dbo.sp_Usuarios_ConsultarPorID @UsuarioID;
END;
GO

-- ============================================
-- 6. DESACTIVAR USUARIO
-- ============================================

CREATE OR ALTER PROCEDURE dbo.sp_Usuarios_Desactivar
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Usuarios
        WHERE UsuarioID = @UsuarioID
    )
    BEGIN
        THROW 50007, 'El usuario no existe.', 1;
    END;

    UPDATE dbo.Usuarios
    SET Activo = 0
    WHERE UsuarioID = @UsuarioID;

    EXEC dbo.sp_Usuarios_ConsultarPorID @UsuarioID;
END;
GO
