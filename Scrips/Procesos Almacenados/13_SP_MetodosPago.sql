USE ClickMarketDB;
GO

-- Catalogo controlado: Tarjeta y Transferencia.
CREATE OR ALTER PROCEDURE dbo.sp_MetodosPago_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MetodoPagoID, Nombre, Descripcion
    FROM dbo.MetodosPago
    ORDER BY MetodoPagoID;
END;
GO
