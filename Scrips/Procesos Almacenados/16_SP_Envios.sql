USE ClickMarketDB;
GO

-- Los envios se crean automaticamente en sp_Pedidos_CrearDesdeCarrito.
-- No se incluye un SP para duplicar un envio de un pedido.

CREATE OR ALTER PROCEDURE dbo.sp_Envios_ConsultarPorID
    @EnvioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT E.EnvioID, E.PedidoID, E.TipoEnvioID, T.Nombre AS TipoEnvio,
           E.Costo, E.Estado, E.FechaEnvio, E.FechaEntrega
    FROM dbo.Envios E
    INNER JOIN dbo.TiposEnvio T ON T.TipoEnvioID = E.TipoEnvioID
    WHERE E.EnvioID = @EnvioID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Envios_ConsultarPorPedido
    @PedidoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT E.EnvioID, E.PedidoID, E.TipoEnvioID, T.Nombre AS TipoEnvio,
           E.Costo, E.Estado, E.FechaEnvio, E.FechaEntrega
    FROM dbo.Envios E
    INNER JOIN dbo.TiposEnvio T ON T.TipoEnvioID = E.TipoEnvioID
    WHERE E.PedidoID = @PedidoID;
END;
GO

-- Transiciones permitidas: Pendiente -> Preparando -> Enviado -> Entregado.
-- El pedido debe estar confirmado antes de comenzar a preparar el envio.
-- El cambio de estado del envio y del pedido es atomico.
CREATE OR ALTER PROCEDURE dbo.sp_Envios_ActualizarEstado
    @EnvioID INT,
    @NuevoEstado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @NuevoEstado IS NULL OR @NuevoEstado NOT IN ('Preparando', 'Enviado', 'Entregado')
        THROW 51602, 'Estado de destino no valido.', 1;

    DECLARE @PedidoID INT, @EstadoActual VARCHAR(20), @EstadoPedido VARCHAR(30),
            @EstadoPedidoID INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Bloquear el pedido primero: mismo orden de bloqueo que otros flujos de pedidos.
        SELECT @PedidoID = PedidoID FROM dbo.Envios WHERE EnvioID = @EnvioID;
        IF @PedidoID IS NULL
            THROW 51603, 'Envio inexistente.', 1;

        SELECT @EstadoPedido = EP.Nombre
        FROM dbo.Pedidos P WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.EstadosPedido EP ON EP.EstadoPedidoID = P.EstadoPedidoID
        WHERE P.PedidoID = @PedidoID;

        SELECT @EstadoActual = Estado
        FROM dbo.Envios WITH (UPDLOCK, HOLDLOCK)
        WHERE EnvioID = @EnvioID;

        IF NOT (
            (@EstadoActual = 'Pendiente' AND @NuevoEstado = 'Preparando' AND @EstadoPedido = 'Confirmado')
            OR (@EstadoActual = 'Preparando' AND @NuevoEstado = 'Enviado' AND @EstadoPedido = 'Confirmado')
            OR (@EstadoActual = 'Enviado' AND @NuevoEstado = 'Entregado' AND @EstadoPedido = 'Enviado')
        )
            THROW 51604, 'Transicion de envio no permitida para el estado actual del pedido.', 1;

        IF @NuevoEstado IN ('Enviado', 'Entregado')
        BEGIN
            SELECT @EstadoPedidoID = EstadoPedidoID
            FROM dbo.EstadosPedido
            WHERE Nombre = @NuevoEstado;
            IF @EstadoPedidoID IS NULL
                THROW 51605, 'No existe el estado de pedido requerido.', 1;
        END;

        UPDATE dbo.Envios
        SET Estado = @NuevoEstado,
            FechaEnvio = CASE WHEN @NuevoEstado = 'Enviado' THEN SYSDATETIME() ELSE FechaEnvio END,
            FechaEntrega = CASE WHEN @NuevoEstado = 'Entregado' THEN SYSDATETIME() ELSE FechaEntrega END
        WHERE EnvioID = @EnvioID;

        IF @EstadoPedidoID IS NOT NULL
            UPDATE dbo.Pedidos SET EstadoPedidoID = @EstadoPedidoID
            WHERE PedidoID = @PedidoID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    EXEC dbo.sp_Envios_ConsultarPorID @EnvioID;
END;
GO
