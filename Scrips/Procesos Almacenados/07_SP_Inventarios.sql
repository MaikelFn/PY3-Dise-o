USE ClickMarketDB;
GO
-- 07 - Inventarios. El inventario se crea automaticamente al crear un producto.
-- Las operaciones de reserva/confirmacion/liberacion deben coordinarse con Pedidos y Pagos.

CREATE OR ALTER PROCEDURE dbo.sp_Inventarios_ConsultarPorProducto
    @ProductoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT I.InventarioID, I.ProductoID, P.Nombre AS Producto,
           I.CantidadDisponible, I.CantidadReservada,
           I.CantidadDisponible + I.CantidadReservada AS CantidadTotal
    FROM dbo.Inventarios I
    INNER JOIN dbo.Productos P ON P.ProductoID = I.ProductoID
    WHERE I.ProductoID = @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Inventarios_Listar
    @VendedorID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT I.InventarioID, I.ProductoID, P.Nombre AS Producto,
           P.VendedorID, I.CantidadDisponible, I.CantidadReservada,
           I.CantidadDisponible + I.CantidadReservada AS CantidadTotal
    FROM dbo.Inventarios I
    INNER JOIN dbo.Productos P ON P.ProductoID = I.ProductoID
    WHERE @VendedorID IS NULL OR P.VendedorID = @VendedorID
    ORDER BY I.ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Inventarios_AgregarExistencias
    @ProductoID INT,
    @VendedorID INT,
    @Cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Cantidad IS NULL OR @Cantidad <= 0
        THROW 50601, 'La cantidad debe ser positiva.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE ProductoID = @ProductoID AND VendedorID = @VendedorID AND Activo = 1)
        THROW 50602, 'Producto inexistente, inactivo o ajeno al vendedor.', 1;
    UPDATE dbo.Inventarios WITH (UPDLOCK)
    SET CantidadDisponible = CantidadDisponible + @Cantidad
    WHERE ProductoID = @ProductoID
      AND CantidadDisponible <= 2147483647 - @Cantidad;
    IF @@ROWCOUNT = 0 THROW 50603, 'Inventario inexistente o cantidad fuera de rango.', 1;
    EXEC dbo.sp_Inventarios_ConsultarPorProducto @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Inventarios_Reservar
    @ProductoID INT,
    @Cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Cantidad IS NULL OR @Cantidad <= 0 THROW 50604, 'La cantidad debe ser positiva.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos P
                   INNER JOIN dbo.Vendedores V ON V.VendedorID = P.VendedorID
                   INNER JOIN dbo.Categorias C ON C.CategoriaID = P.CategoriaID
                   WHERE P.ProductoID = @ProductoID AND P.Activo = 1 AND V.Activo = 1 AND C.Activa = 1)
        THROW 50605, 'El producto no esta disponible para la venta.', 1;
    UPDATE dbo.Inventarios WITH (UPDLOCK)
    SET CantidadDisponible = CantidadDisponible - @Cantidad,
        CantidadReservada = CantidadReservada + @Cantidad
    WHERE ProductoID = @ProductoID
      AND CantidadDisponible >= @Cantidad
      AND CantidadReservada <= 2147483647 - @Cantidad;
    IF @@ROWCOUNT = 0 THROW 50606, 'Existencias insuficientes para reservar.', 1;
    EXEC dbo.sp_Inventarios_ConsultarPorProducto @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Inventarios_LiberarReserva
    @ProductoID INT,
    @Cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Cantidad IS NULL OR @Cantidad <= 0 THROW 50607, 'La cantidad debe ser positiva.', 1;
    UPDATE dbo.Inventarios WITH (UPDLOCK)
    SET CantidadDisponible = CantidadDisponible + @Cantidad,
        CantidadReservada = CantidadReservada - @Cantidad
    WHERE ProductoID = @ProductoID
      AND CantidadReservada >= @Cantidad
      AND CantidadDisponible <= 2147483647 - @Cantidad;
    IF @@ROWCOUNT = 0 THROW 50608, 'Reserva insuficiente o inventario inexistente.', 1;
    EXEC dbo.sp_Inventarios_ConsultarPorProducto @ProductoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Inventarios_ConfirmarSalida
    @ProductoID INT,
    @Cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Cantidad IS NULL OR @Cantidad <= 0 THROW 50609, 'La cantidad debe ser positiva.', 1;
    UPDATE dbo.Inventarios WITH (UPDLOCK)
    SET CantidadReservada = CantidadReservada - @Cantidad
    WHERE ProductoID = @ProductoID AND CantidadReservada >= @Cantidad;
    IF @@ROWCOUNT = 0 THROW 50610, 'Reserva insuficiente o inventario inexistente.', 1;
    EXEC dbo.sp_Inventarios_ConsultarPorProducto @ProductoID;
END;
GO
