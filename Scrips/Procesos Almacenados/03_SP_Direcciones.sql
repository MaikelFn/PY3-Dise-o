USE ClickMarketDB;
GO

-- 1. Agregar direccion
CREATE OR ALTER PROCEDURE dbo.sp_Direcciones_Agregar
    @UsuarioID INT,
    @Provincia NVARCHAR(100),
    @Canton NVARCHAR(100),
    @Distrito NVARCHAR(100),
    @Detalle NVARCHAR(300),
    @Principal BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(TRIM(@Provincia), N'') IS NULL OR
       NULLIF(TRIM(@Canton), N'') IS NULL OR
       NULLIF(TRIM(@Distrito), N'') IS NULL OR
       NULLIF(TRIM(@Detalle), N'') IS NULL
        THROW 50202, 'Todos los campos de direccion son obligatorios.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        -- Bloquear el usuario serializa los cambios de direccion principal.
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Usuarios WITH (UPDLOCK, HOLDLOCK)
            WHERE UsuarioID = @UsuarioID AND Activo = 1
        ) THROW 50201, 'El usuario no existe o esta inactivo.', 1;

        IF @Principal = 1
            UPDATE dbo.Direcciones SET Principal = 0
            WHERE UsuarioID = @UsuarioID AND Principal = 1;

        INSERT INTO dbo.Direcciones (UsuarioID, Provincia, Canton, Distrito, Detalle, Principal)
        VALUES (@UsuarioID, TRIM(@Provincia), TRIM(@Canton), TRIM(@Distrito), TRIM(@Detalle), @Principal);

        DECLARE @DireccionID INT = CONVERT(INT, SCOPE_IDENTITY());
        COMMIT TRANSACTION;
        SELECT DireccionID, UsuarioID, Provincia, Canton, Distrito, Detalle, Principal
        FROM dbo.Direcciones WHERE DireccionID = @DireccionID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- 2. Listar direcciones por usuario
CREATE OR ALTER PROCEDURE dbo.sp_Direcciones_ListarPorUsuario
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DireccionID, UsuarioID, Provincia, Canton, Distrito, Detalle, Principal
    FROM dbo.Direcciones
    WHERE UsuarioID = @UsuarioID
    ORDER BY Principal DESC, DireccionID;
END;
GO

-- 3. Actualizar direccion
CREATE OR ALTER PROCEDURE dbo.sp_Direcciones_Actualizar
    @DireccionID INT,
    @UsuarioID INT,
    @Provincia NVARCHAR(100),
    @Canton NVARCHAR(100),
    @Distrito NVARCHAR(100),
    @Detalle NVARCHAR(300),
    @Principal BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(TRIM(@Provincia), N'') IS NULL OR
       NULLIF(TRIM(@Canton), N'') IS NULL OR
       NULLIF(TRIM(@Distrito), N'') IS NULL OR
       NULLIF(TRIM(@Detalle), N'') IS NULL
        THROW 50204, 'Todos los campos de direccion son obligatorios.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        -- Mismo bloqueo que en Agregar para evitar carreras.
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Usuarios WITH (UPDLOCK, HOLDLOCK)
            WHERE UsuarioID = @UsuarioID AND Activo = 1
        ) THROW 50201, 'El usuario no existe o esta inactivo.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Direcciones
            WHERE DireccionID = @DireccionID AND UsuarioID = @UsuarioID
        ) THROW 50203, 'La direccion no pertenece al usuario.', 1;

        IF @Principal = 1
            UPDATE dbo.Direcciones SET Principal = 0
            WHERE UsuarioID = @UsuarioID AND DireccionID <> @DireccionID AND Principal = 1;

        UPDATE dbo.Direcciones
        SET Provincia = TRIM(@Provincia), Canton = TRIM(@Canton),
            Distrito = TRIM(@Distrito), Detalle = TRIM(@Detalle), Principal = @Principal
        WHERE DireccionID = @DireccionID AND UsuarioID = @UsuarioID;

        COMMIT TRANSACTION;
        SELECT DireccionID, UsuarioID, Provincia, Canton, Distrito, Detalle, Principal
        FROM dbo.Direcciones WHERE DireccionID = @DireccionID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- 4. Eliminar direccion (si no se usa en pedidos)
CREATE OR ALTER PROCEDURE dbo.sp_Direcciones_Eliminar
    @DireccionID INT,
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Usuarios WITH (UPDLOCK, HOLDLOCK)
            WHERE UsuarioID = @UsuarioID
        ) THROW 50201, 'El usuario no existe.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Direcciones
            WHERE DireccionID = @DireccionID AND UsuarioID = @UsuarioID
        ) THROW 50205, 'La direccion no existe o no pertenece al usuario.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Pedidos WHERE DireccionID = @DireccionID)
            THROW 50206, 'No se puede eliminar una direccion utilizada en pedidos.', 1;

        DELETE FROM dbo.Direcciones
        WHERE DireccionID = @DireccionID AND UsuarioID = @UsuarioID;

        COMMIT TRANSACTION;
        SELECT N'Direccion eliminada correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
