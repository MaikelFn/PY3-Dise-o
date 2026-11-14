USE ClickMarketDB;
GO

-- Detalles de pedido son historicos: no se editan directamente.
CREATE OR ALTER PROCEDURE dbo.sp_DetallesPedido_ListarPorPedido
    @PedidoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT D.DetallePedidoID, D.PedidoID, D.ProductoID,
           P.Nombre AS Producto, D.Cantidad,
           D.PrecioUnitario, D.Subtotal
    FROM dbo.DetallesPedido D
    JOIN dbo.Productos P ON P.ProductoID = D.ProductoID
    WHERE D.PedidoID = @PedidoID
    ORDER BY D.DetallePedidoID;
END;
GO
