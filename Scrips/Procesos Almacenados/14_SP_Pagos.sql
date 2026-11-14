USE ClickMarketDB;
GO

-- IMPORTANTE: el backend debe verificar el resultado con la pasarela real.
-- Nunca permitir que un comprador invoque directamente Aprobar/Rechazar.
-- No se almacenan datos sensibles de tarjetas.
CREATE OR ALTER PROCEDURE dbo.sp_Pagos_Registrar
    @PedidoID INT,
    @MetodoPagoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @Monto DECIMAL(12,2);
        SELECT @Monto = P.Total
        FROM dbo.Pedidos P WITH (UPDLOCK, HOLDLOCK)
        JOIN dbo.EstadosPedido E ON E.EstadoPedidoID = P.EstadoPedidoID
        WHERE P.PedidoID = @PedidoID AND E.Nombre = 'Pendiente';
        IF @Monto IS NULL THROW 51401, 'El pedido no existe o no esta pendiente.', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.MetodosPago WHERE MetodoPagoID = @MetodoPagoID AND Activo = 1)
            THROW 51402, 'Metodo de pago inexistente o inactivo.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Pagos WHERE PedidoID = @PedidoID AND Estado IN ('Pendiente', 'Aprobado'))
            THROW 51403, 'Ya existe un pago pendiente o aprobado para este pedido.', 1;

        INSERT INTO dbo.Pagos (PedidoID, MetodoPagoID, Monto, Estado)
        VALUES (@PedidoID, @MetodoPagoID, @Monto, 'Pendiente');
        DECLARE @PagoID INT = CONVERT(INT, SCOPE_IDENTITY());
        COMMIT TRANSACTION;
        SELECT PagoID, PedidoID, MetodoPagoID, Monto, Estado, FechaPago
        FROM dbo.Pagos WHERE PagoID = @PagoID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Pagos_ConsultarPorID
    @PagoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT PA.PagoID, PA.PedidoID, PA.MetodoPagoID, MP.Nombre AS MetodoPago,
           PA.Monto, PA.Estado, PA.FechaPago
    FROM dbo.Pagos PA
    JOIN dbo.MetodosPago MP ON MP.MetodoPagoID = PA.MetodoPagoID
    WHERE PA.PagoID = @PagoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Pagos_ListarPorPedido
    @PedidoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT PA.PagoID, PA.PedidoID, PA.MetodoPagoID, MP.Nombre AS MetodoPago,
           PA.Monto, PA.Estado, PA.FechaPago
    FROM dbo.Pagos PA
    JOIN dbo.MetodosPago MP ON MP.MetodoPagoID = PA.MetodoPagoID
    WHERE PA.PedidoID = @PedidoID
    ORDER BY PA.PagoID DESC;
END;
GO

-- Aprueba el pago y confirma el pedido en UNA sola transaccion.
-- sp_Pedidos_Confirmar consume el inventario reservado; no descontarlo aqui.
-- Llamar solo desde el backend autorizado tras validar el pago externamente.
CREATE OR ALTER PROCEDURE dbo.sp_Pagos_Aprobar
    @PagoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @PedidoID INT, @Monto DECIMAL(12,2), @Total DECIMAL(12,2);
        SELECT @PedidoID = PA.PedidoID, @Monto = PA.Monto
        FROM dbo.Pagos PA
        WHERE PA.PagoID = @PagoID;
        IF @PedidoID IS NULL THROW 51404, 'Pago inexistente.', 1;

        SELECT @Total = P.Total
        FROM dbo.Pedidos P WITH (UPDLOCK, HOLDLOCK)
        JOIN dbo.EstadosPedido E ON E.EstadoPedidoID = P.EstadoPedidoID
        WHERE P.PedidoID = @PedidoID AND E.Nombre = 'Pendiente';
        IF @Total IS NULL THROW 51405, 'El pedido no esta pendiente.', 1;
        IF @Monto <> @Total THROW 51406, 'El monto no coincide con el total del pedido.', 1;

        UPDATE dbo.Pagos
        SET Estado = 'Aprobado', FechaPago = SYSDATETIME()
        WHERE PagoID = @PagoID AND Estado = 'Pendiente';
        IF @@ROWCOUNT <> 1 THROW 51407, 'El pago ya fue procesado.', 1;

        -- La confirmacion abre una transaccion anidada; el COMMIT definitivo
        -- ocurre aqui. Si falla, el pago tambien vuelve a Pendiente.
        EXEC dbo.sp_Pedidos_Confirmar @PedidoID = @PedidoID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- Rechazar el intento permite registrar otro pago para el mismo pedido.
-- La reserva del pedido permanece hasta su cancelacion o confirmacion.
CREATE OR ALTER PROCEDURE dbo.sp_Pagos_Rechazar
    @PagoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @PedidoID INT;
        SELECT @PedidoID = PedidoID FROM dbo.Pagos WHERE PagoID = @PagoID;
        IF @PedidoID IS NULL THROW 51408, 'Pago inexistente.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Pedidos P WITH (UPDLOCK, HOLDLOCK)
            JOIN dbo.EstadosPedido E ON E.EstadoPedidoID = P.EstadoPedidoID
            WHERE P.PedidoID = @PedidoID AND E.Nombre = 'Pendiente'
        ) THROW 51409, 'El pedido no esta pendiente.', 1;

        UPDATE dbo.Pagos
        SET Estado = 'Rechazado', FechaPago = SYSDATETIME()
        WHERE PagoID = @PagoID AND Estado = 'Pendiente';
        IF @@ROWCOUNT <> 1 THROW 51410, 'El pago ya fue procesado.', 1;
        COMMIT TRANSACTION;
        EXEC dbo.sp_Pagos_ConsultarPorID @PagoID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
