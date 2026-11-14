USE ClickMarketDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EstadosPedido_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT EstadoPedidoID, Nombre, Descripcion
    FROM dbo.EstadosPedido
    ORDER BY EstadoPedidoID;
END;
GO
