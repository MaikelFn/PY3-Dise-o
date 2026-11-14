USE ClickMarketDB;
GO

-- 08 - Carritos: un carrito por usuario (restriccion UNIQUE de la tabla).

CREATE OR ALTER PROCEDURE dbo.sp_Carritos_ObtenerOCrear
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @CarritoID INT;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE UsuarioID = @UsuarioID AND Activo = 1)
            THROW 50701, 'Usuario inexistente o inactivo.', 1;
        SELECT @CarritoID = CarritoID
        FROM dbo.Carritos WITH (UPDLOCK, HOLDLOCK)
        WHERE UsuarioID = @UsuarioID;
        IF @CarritoID IS NULL
        BEGIN
            INSERT INTO dbo.Carritos (UsuarioID) VALUES (@UsuarioID);
            SET @CarritoID = CONVERT(INT, SCOPE_IDENTITY());
        END;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    SELECT CarritoID, UsuarioID, FechaCreacion
    FROM dbo.Carritos WHERE CarritoID = @CarritoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Carritos_ConsultarPorUsuario
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT C.CarritoID, C.UsuarioID, C.FechaCreacion,
           COUNT(DC.DetalleCarritoID) AS ProductosDistintos,
           COALESCE(SUM(DC.Cantidad), 0) AS Unidades,
           COALESCE(SUM(CONVERT(DECIMAL(19,2), DC.Cantidad) * P.Precio), 0) AS SubtotalEstimado
    FROM dbo.Carritos C
    LEFT JOIN dbo.DetallesCarrito DC ON DC.CarritoID = C.CarritoID
    LEFT JOIN dbo.Productos P ON P.ProductoID = DC.ProductoID
    WHERE C.UsuarioID = @UsuarioID
    GROUP BY C.CarritoID, C.UsuarioID, C.FechaCreacion;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Carritos_Vaciar
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @CarritoID INT;
    SELECT @CarritoID = CarritoID FROM dbo.Carritos WHERE UsuarioID = @UsuarioID;
    IF @CarritoID IS NULL THROW 50702, 'El usuario no tiene carrito.', 1;
    DELETE FROM dbo.DetallesCarrito WHERE CarritoID = @CarritoID;
    EXEC dbo.sp_Carritos_ConsultarPorUsuario @UsuarioID;
END;
GO
