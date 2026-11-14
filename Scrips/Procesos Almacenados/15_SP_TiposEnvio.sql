USE ClickMarketDB;
GO

-- Catalogo controlado: Estandar y Expres.
CREATE OR ALTER PROCEDURE dbo.sp_TiposEnvio_Listar
    @SoloActivos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TipoEnvioID, Nombre, Descripcion, CostoBase, Activo
    FROM dbo.TiposEnvio
    WHERE @SoloActivos = 0 OR Activo = 1
    ORDER BY TipoEnvioID;
END;
GO
