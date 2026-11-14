USE ClickMarketDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Roles_Listar
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        RolID,
        Nombre,
        Descripcion
    FROM dbo.Roles
    ORDER BY RolID;
END;
GO

PRINT 'Procedimientos de Usuarios y Roles creados correctamente.';
GO
