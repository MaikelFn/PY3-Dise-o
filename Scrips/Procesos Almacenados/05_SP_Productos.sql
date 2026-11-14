USE ClickMarketDB;
GO

-- 05 - Procedimientos almacenados de Productos

CREATE OR ALTER PROCEDURE dbo.sp_Productos_ConsultarPorID
    @ProductoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT P.ProductoID, P.VendedorID, V.NombreComercial AS Vendedor,
           P.CategoriaID, C.Nombre AS Categoria, P.Nombre, P.Descripcion,
           P.Precio, P.FechaCreacion, P.Activo,
           I.CantidadDisponible, I.CantidadReservada,
           (SELECT TOP (1) IP.ImagenURL FROM dbo.ImagenesProducto IP
            WHERE IP.ProductoID = P.ProductoID
            ORDER BY IP.EsPrincipal DESC, IP.Orden, IP.ImagenID) AS ImagenPrincipal
    FROM dbo.Productos P
    INNER JOIN dbo.Vendedores V ON V.VendedorID = P.VendedorID
    INNER JOIN dbo.Categorias C ON C.CategoriaID = P.CategoriaID
    LEFT JOIN dbo.Inventarios I ON I.ProductoID = P.ProductoID
    WHERE P.ProductoID = @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Productos_Crear
    @VendedorID INT,
    @CategoriaID INT,
    @Nombre NVARCHAR(150),
    @Descripcion NVARCHAR(MAX) = NULL,
    @Precio DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @Nombre = NULLIF(TRIM(@Nombre), N'');
    IF @Nombre IS NULL THROW 50401, 'El nombre del producto es obligatorio.', 1;
    IF @Precio IS NULL OR @Precio < 0 THROW 50402, 'El precio debe ser mayor o igual a cero.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Vendedores V
                   LEFT JOIN dbo.Usuarios U ON U.UsuarioID = V.UsuarioID
                   WHERE V.VendedorID = @VendedorID AND V.Activo = 1
                     AND (V.EsClickMarket = 1 OR U.Activo = 1))
        THROW 50403, 'El vendedor no existe o esta inactivo.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE CategoriaID = @CategoriaID AND Activa = 1)
        THROW 50404, 'La categoria no existe o esta inactiva.', 1;

    DECLARE @ProductoID INT;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO dbo.Productos (VendedorID, CategoriaID, Nombre, Descripcion, Precio)
        VALUES (@VendedorID, @CategoriaID, @Nombre, @Descripcion, @Precio);
        SET @ProductoID = CONVERT(INT, SCOPE_IDENTITY());
        INSERT INTO dbo.Inventarios (ProductoID, CantidadDisponible, CantidadReservada)
        VALUES (@ProductoID, 0, 0);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    EXEC dbo.sp_Productos_ConsultarPorID @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Productos_Listar
    @CategoriaID INT = NULL,
    @VendedorID INT = NULL,
    @Busqueda NVARCHAR(150) = NULL,
    @SoloActivos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT P.ProductoID, P.VendedorID, V.NombreComercial AS Vendedor,
           P.CategoriaID, C.Nombre AS Categoria, P.Nombre, P.Descripcion,
           P.Precio, P.FechaCreacion, P.Activo,
           I.CantidadDisponible,
           (SELECT TOP (1) IP.ImagenURL FROM dbo.ImagenesProducto IP
            WHERE IP.ProductoID = P.ProductoID
            ORDER BY IP.EsPrincipal DESC, IP.Orden, IP.ImagenID) AS ImagenPrincipal
    FROM dbo.Productos P
    INNER JOIN dbo.Vendedores V ON V.VendedorID = P.VendedorID
    INNER JOIN dbo.Categorias C ON C.CategoriaID = P.CategoriaID
    LEFT JOIN dbo.Inventarios I ON I.ProductoID = P.ProductoID
    WHERE (@CategoriaID IS NULL OR P.CategoriaID = @CategoriaID)
      AND (@VendedorID IS NULL OR P.VendedorID = @VendedorID)
      AND (@Busqueda IS NULL OR P.Nombre LIKE N'%' + @Busqueda + N'%')
      AND (@SoloActivos = 0 OR (P.Activo = 1 AND V.Activo = 1 AND C.Activa = 1))
    ORDER BY P.FechaCreacion DESC, P.ProductoID DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Productos_Actualizar
    @ProductoID INT,
    @VendedorID INT,
    @CategoriaID INT,
    @Nombre NVARCHAR(150),
    @Descripcion NVARCHAR(MAX) = NULL,
    @Precio DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET @Nombre = NULLIF(TRIM(@Nombre), N'');
    IF @Nombre IS NULL THROW 50405, 'El nombre del producto es obligatorio.', 1;
    IF @Precio IS NULL OR @Precio < 0 THROW 50406, 'El precio debe ser mayor o igual a cero.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE ProductoID = @ProductoID
                   AND VendedorID = @VendedorID AND Activo = 1)
        THROW 50407, 'El producto no existe, esta inactivo o no pertenece al vendedor.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE CategoriaID = @CategoriaID AND Activa = 1)
        THROW 50408, 'La categoria no existe o esta inactiva.', 1;
    UPDATE dbo.Productos
    SET CategoriaID = @CategoriaID, Nombre = @Nombre,
        Descripcion = @Descripcion, Precio = @Precio
    WHERE ProductoID = @ProductoID AND VendedorID = @VendedorID;
    EXEC dbo.sp_Productos_ConsultarPorID @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Productos_Desactivar
    @ProductoID INT,
    @VendedorID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos
                   WHERE ProductoID = @ProductoID AND VendedorID = @VendedorID)
        THROW 50409, 'El producto no existe o no pertenece al vendedor.', 1;
    UPDATE dbo.Productos SET Activo = 0
    WHERE ProductoID = @ProductoID AND VendedorID = @VendedorID;
    EXEC dbo.sp_Productos_ConsultarPorID @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Productos_Activar
    @ProductoID INT,
    @VendedorID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos
                   WHERE ProductoID = @ProductoID AND VendedorID = @VendedorID)
        THROW 50410, 'El producto no existe o no pertenece al vendedor.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos P
                   INNER JOIN dbo.Categorias C ON C.CategoriaID = P.CategoriaID
                   INNER JOIN dbo.Vendedores V ON V.VendedorID = P.VendedorID
                   LEFT JOIN dbo.Usuarios U ON U.UsuarioID = V.UsuarioID
                   WHERE P.ProductoID = @ProductoID AND C.Activa = 1 AND V.Activo = 1
                     AND (V.EsClickMarket = 1 OR U.Activo = 1))
        THROW 50411, 'La categoria o el vendedor estan inactivos.', 1;
    UPDATE dbo.Productos SET Activo = 1
    WHERE ProductoID = @ProductoID AND VendedorID = @VendedorID;
    EXEC dbo.sp_Productos_ConsultarPorID @ProductoID;
END;
GO
