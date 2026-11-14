USE ClickMarketDB;
GO

-- Catalogo controlado: Tarjeta y Transferencia.
CREATE OR ALTER PROCEDURE dbo.sp_MetodosPago_Listar
    @SoloActivos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MetodoPagoID, Nombre, Descripcion, Activo
    FROM dbo.MetodosPago
    WHERE @SoloActivos = 0 OR Activo = 1
    ORDER BY MetodoPagoID;
END;
GO
