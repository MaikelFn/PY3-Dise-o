USE ClickMarketDB;
GO

IF COL_LENGTH('dbo.MetodosPago', 'Activo') IS NULL
BEGIN
    ALTER TABLE dbo.MetodosPago
    ADD Activo BIT NOT NULL
        CONSTRAINT DF_MetodosPago_Activo DEFAULT (1) WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.TiposEnvio', 'Activo') IS NULL
BEGIN
    ALTER TABLE dbo.TiposEnvio
    ADD Activo BIT NOT NULL
        CONSTRAINT DF_TiposEnvio_Activo DEFAULT (1) WITH VALUES;
END;
GO
