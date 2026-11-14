USE master;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.databases
    WHERE name = 'ClickMarketDB'
)
BEGIN
    CREATE DATABASE ClickMarketDB;
END;
GO

USE ClickMarketDB;
GO

SELECT DB_NAME() AS BaseDatosActual;
GO