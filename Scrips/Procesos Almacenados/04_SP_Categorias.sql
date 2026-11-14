USE ClickMarketDB;
GO

-- 04 - Procedimientos almacenados de Categorias

CREATE OR ALTER PROCEDURE dbo.sp_Categorias_Crear
    @Nombre NVARCHAR(100),
    @Descripcion NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @Nombre = NULLIF(TRIM(@Nombre), N'');
    IF @Nombre IS NULL THROW 50301, 'El nombre de la categoria es obligatorio.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = @Nombre)
        THROW 50302, 'Ya existe una categoria con ese nombre.', 1;

    INSERT INTO dbo.Categorias (Nombre, Descripcion)
    VALUES (@Nombre, @Descripcion);

    SELECT CategoriaID, Nombre, Descripcion, Activa
    FROM dbo.Categorias WHERE CategoriaID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Categorias_ConsultarPorID
    @CategoriaID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CategoriaID, Nombre, Descripcion, Activa
    FROM dbo.Categorias WHERE CategoriaID = @CategoriaID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Categorias_Listar
    @SoloActivas BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CategoriaID, Nombre, Descripcion, Activa
    FROM dbo.Categorias
    WHERE @SoloActivas = 0 OR Activa = 1
    ORDER BY Nombre;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Categorias_Actualizar
    @CategoriaID INT,
    @Nombre NVARCHAR(100),
    @Descripcion NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @Nombre = NULLIF(TRIM(@Nombre), N'');
    IF @Nombre IS NULL THROW 50303, 'El nombre de la categoria es obligatorio.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE CategoriaID = @CategoriaID)
        THROW 50304, 'La categoria no existe.', 1;
    IF EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = @Nombre AND CategoriaID <> @CategoriaID)
        THROW 50305, 'El nombre pertenece a otra categoria.', 1;

    UPDATE dbo.Categorias SET Nombre = @Nombre, Descripcion = @Descripcion
    WHERE CategoriaID = @CategoriaID;
    EXEC dbo.sp_Categorias_ConsultarPorID @CategoriaID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Categorias_Desactivar
    @CategoriaID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE CategoriaID = @CategoriaID)
        THROW 50306, 'La categoria no existe.', 1;
    UPDATE dbo.Categorias SET Activa = 0 WHERE CategoriaID = @CategoriaID;
    EXEC dbo.sp_Categorias_ConsultarPorID @CategoriaID;
END;
GO
