USE ClickMarketDB;
GO

IF COL_LENGTH('dbo.Categorias', 'Activa') IS NULL
BEGIN
    ALTER TABLE dbo.Categorias
    ADD Activa BIT NOT NULL
        CONSTRAINT DF_Categorias_Activa DEFAULT (1) WITH VALUES;
END;
GO
