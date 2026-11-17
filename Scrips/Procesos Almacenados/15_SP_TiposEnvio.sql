USE ClickMarketDB;
GO

-- Catalogo controlado: Estandar y Expres.
CREATE OR ALTER PROCEDURE dbo.sp_TiposEnvio_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TipoEnvioID, Nombre, Descripcion, CostoBase
    FROM dbo.TiposEnvio
    ORDER BY TipoEnvioID;
END;
GO
