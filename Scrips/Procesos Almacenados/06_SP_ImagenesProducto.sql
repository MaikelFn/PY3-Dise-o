USE ClickMarketDB;
GO

-- 06 - Procedimientos almacenados de ImagenesProducto

CREATE OR ALTER PROCEDURE dbo.sp_ImagenesProducto_ListarPorProducto
    @ProductoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ImagenID, ProductoID, ImagenURL, EsPrincipal, Orden
    FROM dbo.ImagenesProducto
    WHERE ProductoID = @ProductoID
    ORDER BY EsPrincipal DESC, Orden, ImagenID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ImagenesProducto_Agregar
    @ProductoID INT,
    @VendedorID INT,
    @ImagenURL NVARCHAR(500),
    @EsPrincipal BIT = 0,
    @Orden INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @ImagenURL = NULLIF(TRIM(@ImagenURL), N'');
    IF @ImagenURL IS NULL THROW 50501, 'La ruta de la imagen es obligatoria.', 1;
    IF @Orden IS NULL OR @Orden < 0 THROW 50502, 'El orden no puede ser negativo.', 1;
    DECLARE @ImagenID INT;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.Productos WITH (UPDLOCK, HOLDLOCK)
                       WHERE ProductoID = @ProductoID AND VendedorID = @VendedorID AND Activo = 1)
            THROW 50503, 'Producto no encontrado, inactivo o de otro vendedor.', 1;
        IF @EsPrincipal = 1
            UPDATE dbo.ImagenesProducto SET EsPrincipal = 0
            WHERE ProductoID = @ProductoID AND EsPrincipal = 1;
        INSERT INTO dbo.ImagenesProducto (ProductoID, ImagenURL, EsPrincipal, Orden)
        VALUES (@ProductoID, @ImagenURL, @EsPrincipal, @Orden);
        SET @ImagenID = CONVERT(INT, SCOPE_IDENTITY());
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    SELECT ImagenID, ProductoID, ImagenURL, EsPrincipal, Orden
    FROM dbo.ImagenesProducto WHERE ImagenID = @ImagenID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ImagenesProducto_EstablecerPrincipal
    @ImagenID INT,
    @VendedorID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @ProductoID INT;
    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @ProductoID = P.ProductoID
        FROM dbo.Productos P WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ImagenesProducto IP ON IP.ProductoID = P.ProductoID
        WHERE IP.ImagenID = @ImagenID AND P.VendedorID = @VendedorID AND P.Activo = 1;
        IF @ProductoID IS NULL
            THROW 50507, 'Imagen no encontrada o sin permiso para modificarla.', 1;
        UPDATE dbo.ImagenesProducto SET EsPrincipal = 0
        WHERE ProductoID = @ProductoID AND EsPrincipal = 1;
        UPDATE dbo.ImagenesProducto SET EsPrincipal = 1 WHERE ImagenID = @ImagenID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    EXEC dbo.sp_ImagenesProducto_ListarPorProducto @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ImagenesProducto_Eliminar
    @ImagenID INT,
    @VendedorID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE IP
    FROM dbo.ImagenesProducto IP
    INNER JOIN dbo.Productos P ON P.ProductoID = IP.ProductoID
    WHERE IP.ImagenID = @ImagenID AND P.VendedorID = @VendedorID;
    IF @@ROWCOUNT = 0 THROW 50508, 'Imagen no encontrada o sin permiso para eliminarla.', 1;
    SELECT N'Imagen eliminada correctamente.' AS Mensaje;
END;
GO
