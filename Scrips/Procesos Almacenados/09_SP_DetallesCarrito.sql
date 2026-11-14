USE ClickMarketDB;
GO

-- 09 - DetallesCarrito. Las cantidades en el carrito NO reservan inventario.

CREATE OR ALTER PROCEDURE dbo.sp_DetallesCarrito_ListarPorUsuario
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DC.DetalleCarritoID, DC.CarritoID, DC.ProductoID,
           P.Nombre AS Producto, P.Precio, DC.Cantidad,
           CONVERT(DECIMAL(19,2), DC.Cantidad) * P.Precio AS Subtotal,
           I.CantidadDisponible, P.Activo
    FROM dbo.Carritos C
    INNER JOIN dbo.DetallesCarrito DC ON DC.CarritoID = C.CarritoID
    INNER JOIN dbo.Productos P ON P.ProductoID = DC.ProductoID
    LEFT JOIN dbo.Inventarios I ON I.ProductoID = DC.ProductoID
    WHERE C.UsuarioID = @UsuarioID
    ORDER BY DC.DetalleCarritoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_DetallesCarrito_Agregar
    @UsuarioID INT,
    @ProductoID INT,
    @Cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Cantidad IS NULL OR @Cantidad <= 0 THROW 50801, 'La cantidad debe ser positiva.', 1;
    DECLARE @CarritoID INT, @Disponible INT, @Actual INT;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE UsuarioID = @UsuarioID AND Activo = 1)
            THROW 50802, 'Usuario inexistente o inactivo.', 1;
        SELECT @Disponible = I.CantidadDisponible
        FROM dbo.Productos P
        INNER JOIN dbo.Vendedores V ON V.VendedorID = P.VendedorID
        INNER JOIN dbo.Categorias CA ON CA.CategoriaID = P.CategoriaID
        INNER JOIN dbo.Inventarios I ON I.ProductoID = P.ProductoID
        WHERE P.ProductoID = @ProductoID AND P.Activo = 1 AND V.Activo = 1 AND CA.Activa = 1;
        IF @Disponible IS NULL THROW 50803, 'Producto no disponible.', 1;
        SELECT @CarritoID = CarritoID FROM dbo.Carritos WITH (UPDLOCK, HOLDLOCK) WHERE UsuarioID = @UsuarioID;
        IF @CarritoID IS NULL
        BEGIN
            INSERT INTO dbo.Carritos (UsuarioID) VALUES (@UsuarioID);
            SET @CarritoID = CONVERT(INT, SCOPE_IDENTITY());
        END;
        SELECT @Actual = Cantidad FROM dbo.DetallesCarrito WITH (UPDLOCK, HOLDLOCK)
        WHERE CarritoID = @CarritoID AND ProductoID = @ProductoID;
        IF @Cantidad > @Disponible OR COALESCE(@Actual, 0) > @Disponible - @Cantidad
            THROW 50804, 'Cantidad solicitada mayor que las existencias actuales.', 1;
        IF @Actual IS NULL
            INSERT INTO dbo.DetallesCarrito (CarritoID, ProductoID, Cantidad) VALUES (@CarritoID, @ProductoID, @Cantidad);
        ELSE
            UPDATE dbo.DetallesCarrito SET Cantidad = Cantidad + @Cantidad
            WHERE CarritoID = @CarritoID AND ProductoID = @ProductoID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    EXEC dbo.sp_DetallesCarrito_ListarPorUsuario @UsuarioID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_DetallesCarrito_ActualizarCantidad
    @UsuarioID INT,
    @ProductoID INT,
    @Cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Cantidad IS NULL OR @Cantidad <= 0 THROW 50805, 'La cantidad debe ser positiva.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.DetallesCarrito DC
                   INNER JOIN dbo.Carritos C ON C.CarritoID = DC.CarritoID
                   WHERE C.UsuarioID = @UsuarioID AND DC.ProductoID = @ProductoID)
        THROW 50806, 'El producto no esta en el carrito.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Inventarios I
                   INNER JOIN dbo.Productos P ON P.ProductoID = I.ProductoID
                   INNER JOIN dbo.Vendedores V ON V.VendedorID = P.VendedorID
                   INNER JOIN dbo.Categorias CA ON CA.CategoriaID = P.CategoriaID
                   WHERE I.ProductoID = @ProductoID AND I.CantidadDisponible >= @Cantidad
                     AND P.Activo = 1 AND V.Activo = 1 AND CA.Activa = 1)
        THROW 50807, 'Producto inactivo o existencias insuficientes.', 1;
    UPDATE DC SET Cantidad = @Cantidad
    FROM dbo.DetallesCarrito DC
    INNER JOIN dbo.Carritos C ON C.CarritoID = DC.CarritoID
    WHERE C.UsuarioID = @UsuarioID AND DC.ProductoID = @ProductoID;
    EXEC dbo.sp_DetallesCarrito_ListarPorUsuario @UsuarioID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_DetallesCarrito_Eliminar
    @UsuarioID INT,
    @ProductoID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE DC
    FROM dbo.DetallesCarrito DC
    INNER JOIN dbo.Carritos C ON C.CarritoID = DC.CarritoID
    WHERE C.UsuarioID = @UsuarioID AND DC.ProductoID = @ProductoID;
    IF @@ROWCOUNT = 0 THROW 50808, 'El producto no estaba en el carrito.', 1;
    EXEC dbo.sp_DetallesCarrito_ListarPorUsuario @UsuarioID;
END;
GO
