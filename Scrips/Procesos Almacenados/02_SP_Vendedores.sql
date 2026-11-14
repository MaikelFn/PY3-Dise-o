USE ClickMarketDB;
GO

-- 1. Consultar por ID
CREATE OR ALTER PROCEDURE dbo.sp_Vendedores_ConsultarPorID
    @VendedorID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT V.VendedorID, V.UsuarioID, V.NombreComercial, V.Descripcion,
           V.EsClickMarket, V.Activo, U.Nombre, U.Apellido, U.Correo
    FROM dbo.Vendedores AS V
    LEFT JOIN dbo.Usuarios AS U ON U.UsuarioID = V.UsuarioID
    WHERE V.VendedorID = @VendedorID;
END;
GO

-- 2. Registrar vendedor externo
CREATE OR ALTER PROCEDURE dbo.sp_Vendedores_Registrar
    @UsuarioID INT,
    @NombreComercial NVARCHAR(150),
    @Descripcion NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(TRIM(@NombreComercial), N'') IS NULL
        THROW 50101, 'El nombre comercial es obligatorio.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.Usuarios AS U
        JOIN dbo.Roles AS R ON R.RolID = U.RolID
        WHERE U.UsuarioID = @UsuarioID AND U.Activo = 1 AND R.Nombre = 'Vendedor'
    ) THROW 50102, 'El usuario no existe, esta inactivo o no tiene rol Vendedor.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Vendedores WHERE UsuarioID = @UsuarioID)
        THROW 50103, 'El usuario ya tiene un registro de vendedor.', 1;

    INSERT INTO dbo.Vendedores (UsuarioID, NombreComercial, Descripcion, EsClickMarket, Activo)
    VALUES (@UsuarioID, TRIM(@NombreComercial), @Descripcion, 0, 1);

    DECLARE @VendedorID INT = CONVERT(INT, SCOPE_IDENTITY());
    EXEC dbo.sp_Vendedores_ConsultarPorID @VendedorID;
END;
GO

-- 3. Listar vendedores
CREATE OR ALTER PROCEDURE dbo.sp_Vendedores_Listar
    @SoloActivos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT VendedorID, UsuarioID, NombreComercial, Descripcion, EsClickMarket, Activo
    FROM dbo.Vendedores
    WHERE @SoloActivos = 0 OR Activo = 1
    ORDER BY NombreComercial;
END;
GO

-- 4. Actualizar informacion comercial
CREATE OR ALTER PROCEDURE dbo.sp_Vendedores_Actualizar
    @VendedorID INT,
    @NombreComercial NVARCHAR(150),
    @Descripcion NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(TRIM(@NombreComercial), N'') IS NULL
        THROW 50105, 'El nombre comercial es obligatorio.', 1;

    UPDATE dbo.Vendedores
    SET NombreComercial = TRIM(@NombreComercial), Descripcion = @Descripcion
    WHERE VendedorID = @VendedorID AND Activo = 1;

    IF @@ROWCOUNT = 0
        THROW 50104, 'El vendedor no existe o esta inactivo.', 1;

    EXEC dbo.sp_Vendedores_ConsultarPorID @VendedorID;
END;
GO

-- 5. Desactivar vendedor externo
CREATE OR ALTER PROCEDURE dbo.sp_Vendedores_Desactivar
    @VendedorID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Vendedores
    SET Activo = 0
    WHERE VendedorID = @VendedorID AND EsClickMarket = 0;

    IF @@ROWCOUNT = 0
        THROW 50106, 'Vendedor externo no encontrado.', 1;

    EXEC dbo.sp_Vendedores_ConsultarPorID @VendedorID;
END;
GO
