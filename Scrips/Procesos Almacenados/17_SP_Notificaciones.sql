USE ClickMarketDB;
GO

-- Las notificaciones se generan desde el backend o desde un flujo autorizado.
-- El backend debe comprobar que el usuario solo acceda a sus propias notificaciones.

CREATE OR ALTER PROCEDURE dbo.sp_Notificaciones_Crear
    @UsuarioID INT,
    @Titulo NVARCHAR(150),
    @Mensaje NVARCHAR(500),
    @PedidoID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(TRIM(@Titulo), N'') IS NULL OR NULLIF(TRIM(@Mensaje), N'') IS NULL
        THROW 51701, 'Titulo y mensaje son obligatorios.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE UsuarioID = @UsuarioID AND Activo = 1)
        THROW 51702, 'Usuario inexistente o inactivo.', 1;

    IF @PedidoID IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM dbo.Pedidos
        WHERE PedidoID = @PedidoID AND UsuarioID = @UsuarioID
    )
        THROW 51703, 'El pedido no pertenece al usuario.', 1;

    INSERT INTO dbo.Notificaciones (UsuarioID, PedidoID, Titulo, Mensaje)
    VALUES (@UsuarioID, @PedidoID, TRIM(@Titulo), TRIM(@Mensaje));

    DECLARE @NotificacionID INT = CONVERT(INT, SCOPE_IDENTITY());
    SELECT NotificacionID, UsuarioID, PedidoID, Titulo, Mensaje, Leida, FechaCreacion
    FROM dbo.Notificaciones WHERE NotificacionID = @NotificacionID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notificaciones_ConsultarPorID
    @NotificacionID INT,
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT NotificacionID, UsuarioID, PedidoID, Titulo, Mensaje, Leida, FechaCreacion
    FROM dbo.Notificaciones
    WHERE NotificacionID = @NotificacionID AND UsuarioID = @UsuarioID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notificaciones_ListarPorUsuario
    @UsuarioID INT,
    @SoloNoLeidas BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT NotificacionID, UsuarioID, PedidoID, Titulo, Mensaje, Leida, FechaCreacion
    FROM dbo.Notificaciones
    WHERE UsuarioID = @UsuarioID AND (@SoloNoLeidas = 0 OR Leida = 0)
    ORDER BY FechaCreacion DESC, NotificacionID DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notificaciones_MarcarLeida
    @NotificacionID INT,
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Notificaciones SET Leida = 1
    WHERE NotificacionID = @NotificacionID AND UsuarioID = @UsuarioID;
    IF @@ROWCOUNT = 0
        THROW 51704, 'Notificacion inexistente o no pertenece al usuario.', 1;
    EXEC dbo.sp_Notificaciones_ConsultarPorID @NotificacionID, @UsuarioID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notificaciones_MarcarTodasLeidas
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Notificaciones SET Leida = 1
    WHERE UsuarioID = @UsuarioID AND Leida = 0;
    SELECT @@ROWCOUNT AS NotificacionesActualizadas;
END;
GO
