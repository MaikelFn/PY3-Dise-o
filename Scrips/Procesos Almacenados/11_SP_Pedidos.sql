USE ClickMarketDB;
GO

-- Crea un pedido desde el carrito. El costo de envio usa el CostoBase
-- del tipo de envio. Strategy podra calcularlo en la API y, cuando se
-- implemente, se ajustara este contrato de forma controlada.
CREATE OR ALTER PROCEDURE dbo.sp_Pedidos_CrearDesdeCarrito
    @UsuarioID INT,
    @DireccionID INT,
    @TipoEnvioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CarritoID INT, @EstadoPedidoID INT,
            @Subtotal DECIMAL(12,2), @CostoEnvio DECIMAL(12,2),
            @PedidoID INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Bloquea el usuario para serializar compras simultaneas del mismo usuario.
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Usuarios WITH (UPDLOCK, HOLDLOCK)
            WHERE UsuarioID = @UsuarioID AND Activo = 1
        )
            THROW 51101, 'Usuario inexistente o inactivo.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Direcciones
            WHERE DireccionID = @DireccionID AND UsuarioID = @UsuarioID
        )
            THROW 51102, 'La direccion no pertenece al usuario.', 1;

        SELECT @CostoEnvio = CostoBase
        FROM dbo.TiposEnvio
        WHERE TipoEnvioID = @TipoEnvioID AND Activo = 1;

        IF @CostoEnvio IS NULL
            THROW 51103, 'Tipo de envio inexistente o inactivo.', 1;

        SELECT @EstadoPedidoID = EstadoPedidoID
        FROM dbo.EstadosPedido WHERE Nombre = 'Pendiente';

        IF @EstadoPedidoID IS NULL
            THROW 51104, 'Falta el estado Pendiente.', 1;

        SELECT @CarritoID = CarritoID
        FROM dbo.Carritos WITH (UPDLOCK, HOLDLOCK)
        WHERE UsuarioID = @UsuarioID;

        IF @CarritoID IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.DetallesCarrito WHERE CarritoID = @CarritoID
        )
            THROW 51105, 'El carrito esta vacio.', 1;

        -- Validar productos, vendedores y categorias antes de reservar.
        IF EXISTS (
            SELECT 1
            FROM dbo.DetallesCarrito DC
            JOIN dbo.Productos P ON P.ProductoID = DC.ProductoID
            JOIN dbo.Vendedores V ON V.VendedorID = P.VendedorID
            JOIN dbo.Categorias C ON C.CategoriaID = P.CategoriaID
            WHERE DC.CarritoID = @CarritoID
              AND (P.Activo = 0 OR V.Activo = 0 OR C.Activa = 0)
        )
            THROW 51106, 'El carrito contiene productos no disponibles.', 1;

        -- Validar importes antes de insertar (DECIMAL(12,2)).
        SELECT @Subtotal = SUM(CONVERT(DECIMAL(19,2), DC.Cantidad) * P.Precio)
        FROM dbo.DetallesCarrito DC
        JOIN dbo.Productos P ON P.ProductoID = DC.ProductoID
        WHERE DC.CarritoID = @CarritoID;

        IF @Subtotal IS NULL OR @Subtotal + @CostoEnvio > 9999999999.99
            THROW 51107, 'Total del pedido invalido o demasiado grande.', 1;

        -- Una actualizacion atomica por producto evita sobreventa.
        -- La transaccion se revierte si falta inventario para cualquier linea.
        DECLARE @ProductoID INT, @Cantidad INT;
        DECLARE cur_reserva CURSOR LOCAL FAST_FORWARD FOR
            SELECT ProductoID, Cantidad
            FROM dbo.DetallesCarrito
            WHERE CarritoID = @CarritoID
            ORDER BY ProductoID;

        OPEN cur_reserva;
        FETCH NEXT FROM cur_reserva INTO @ProductoID, @Cantidad;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            UPDATE dbo.Inventarios WITH (UPDLOCK)
            SET CantidadDisponible = CantidadDisponible - @Cantidad,
                CantidadReservada = CantidadReservada + @Cantidad
            WHERE ProductoID = @ProductoID
              AND CantidadDisponible >= @Cantidad;

            IF @@ROWCOUNT <> 1
            BEGIN
                CLOSE cur_reserva;
                DEALLOCATE cur_reserva;
                THROW 51108, 'Inventario insuficiente para uno o mas productos.', 1;
            END;

            FETCH NEXT FROM cur_reserva INTO @ProductoID, @Cantidad;
        END;
        CLOSE cur_reserva;
        DEALLOCATE cur_reserva;

        INSERT INTO dbo.Pedidos (
            UsuarioID, DireccionID, EstadoPedidoID, Subtotal, CostoEnvio, Total
        ) VALUES (
            @UsuarioID, @DireccionID, @EstadoPedidoID,
            @Subtotal, @CostoEnvio, @Subtotal + @CostoEnvio
        );
        SET @PedidoID = CONVERT(INT, SCOPE_IDENTITY());

        INSERT INTO dbo.DetallesPedido (
            PedidoID, ProductoID, Cantidad, PrecioUnitario, Subtotal
        )
        SELECT @PedidoID, DC.ProductoID, DC.Cantidad, P.Precio,
               CONVERT(DECIMAL(12,2), DC.Cantidad * P.Precio)
        FROM dbo.DetallesCarrito DC
        JOIN dbo.Productos P ON P.ProductoID = DC.ProductoID
        WHERE DC.CarritoID = @CarritoID;

        INSERT INTO dbo.Envios (PedidoID, TipoEnvioID, Costo, Estado)
        VALUES (@PedidoID, @TipoEnvioID, @CostoEnvio, 'Pendiente');

        DELETE FROM dbo.DetallesCarrito WHERE CarritoID = @CarritoID;

        COMMIT TRANSACTION;
        SELECT @PedidoID AS PedidoID;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'cur_reserva') >= 0 CLOSE cur_reserva;
        IF CURSOR_STATUS('local', 'cur_reserva') >= -1 DEALLOCATE cur_reserva;
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Pedidos_ConsultarPorID
    @PedidoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT P.PedidoID, P.UsuarioID, P.DireccionID,
           P.EstadoPedidoID, E.Nombre AS EstadoPedido,
           P.FechaPedido, P.Subtotal, P.CostoEnvio, P.Total
    FROM dbo.Pedidos P
    JOIN dbo.EstadosPedido E ON E.EstadoPedidoID = P.EstadoPedidoID
    WHERE P.PedidoID = @PedidoID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Pedidos_ListarPorUsuario
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT P.PedidoID, P.UsuarioID, P.DireccionID,
           E.Nombre AS EstadoPedido, P.FechaPedido,
           P.Subtotal, P.CostoEnvio, P.Total
    FROM dbo.Pedidos P
    JOIN dbo.EstadosPedido E ON E.EstadoPedidoID = P.EstadoPedidoID
    WHERE P.UsuarioID = @UsuarioID
    ORDER BY P.FechaPedido DESC, P.PedidoID DESC;
END;
GO

-- Confirmar el pedido SOLO tras comprobar que el pago esta aprobado.
-- Consume la reserva aqui una sola vez; el SP de Pagos no debe consumirla de nuevo.
CREATE OR ALTER PROCEDURE dbo.sp_Pedidos_Confirmar
    @PedidoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @Pendiente INT, @Confirmado INT;
        SELECT @Pendiente = EstadoPedidoID FROM dbo.EstadosPedido WHERE Nombre = 'Pendiente';
        SELECT @Confirmado = EstadoPedidoID FROM dbo.EstadosPedido WHERE Nombre = 'Confirmado';
        IF @Pendiente IS NULL OR @Confirmado IS NULL
            THROW 51109, 'Faltan estados de pedido.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.Pagos
            WHERE PedidoID = @PedidoID AND Estado = 'Aprobado'
        )
            THROW 51110, 'No existe un pago aprobado para el pedido.', 1;

        UPDATE dbo.Pedidos
        SET EstadoPedidoID = @Confirmado
        WHERE PedidoID = @PedidoID AND EstadoPedidoID = @Pendiente;
        IF @@ROWCOUNT <> 1
            THROW 51111, 'El pedido no esta pendiente.', 1;

        DECLARE @ProductoID INT, @Cantidad INT;
        DECLARE cur_confirmar CURSOR LOCAL FAST_FORWARD FOR
            SELECT ProductoID, SUM(Cantidad)
            FROM dbo.DetallesPedido
            WHERE PedidoID = @PedidoID
            GROUP BY ProductoID
            ORDER BY ProductoID;
        OPEN cur_confirmar;
        FETCH NEXT FROM cur_confirmar INTO @ProductoID, @Cantidad;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            UPDATE dbo.Inventarios
            SET CantidadReservada = CantidadReservada - @Cantidad
            WHERE ProductoID = @ProductoID AND CantidadReservada >= @Cantidad;
            IF @@ROWCOUNT <> 1
            BEGIN
                CLOSE cur_confirmar;
                DEALLOCATE cur_confirmar;
                THROW 51116, 'No se pudo confirmar la salida del inventario.', 1;
            END;
            FETCH NEXT FROM cur_confirmar INTO @ProductoID, @Cantidad;
        END;
        CLOSE cur_confirmar;
        DEALLOCATE cur_confirmar;

        COMMIT TRANSACTION;
        EXEC dbo.sp_Pedidos_ConsultarPorID @PedidoID;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'cur_confirmar') >= 0 CLOSE cur_confirmar;
        IF CURSOR_STATUS('local', 'cur_confirmar') >= -1 DEALLOCATE cur_confirmar;
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- Solo se cancela un pedido pendiente sin pago aprobado.
-- Si ya se confirmo el pago, requiere un flujo de reembolso aparte.
CREATE OR ALTER PROCEDURE dbo.sp_Pedidos_Cancelar
    @PedidoID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @Pendiente INT, @Cancelado INT;
        SELECT @Pendiente = EstadoPedidoID FROM dbo.EstadosPedido WHERE Nombre = 'Pendiente';
        SELECT @Cancelado = EstadoPedidoID FROM dbo.EstadosPedido WHERE Nombre = 'Cancelado';
        IF @Pendiente IS NULL OR @Cancelado IS NULL
            THROW 51112, 'Faltan estados de pedido.', 1;

        -- Bloqueo del pedido durante validacion y liberacion de reservas.
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Pedidos WITH (UPDLOCK, HOLDLOCK)
            WHERE PedidoID = @PedidoID AND EstadoPedidoID = @Pendiente
        )
            THROW 51113, 'Solo pueden cancelarse pedidos pendientes.', 1;

        IF EXISTS (
            SELECT 1 FROM dbo.Pagos WITH (UPDLOCK, HOLDLOCK)
            WHERE PedidoID = @PedidoID AND Estado = 'Aprobado'
        )
            THROW 51114, 'Un pedido con pago aprobado requiere reembolso.', 1;

        DECLARE @ProductoID INT, @Cantidad INT;
        DECLARE cur_liberar CURSOR LOCAL FAST_FORWARD FOR
            SELECT ProductoID, SUM(Cantidad)
            FROM dbo.DetallesPedido
            WHERE PedidoID = @PedidoID
            GROUP BY ProductoID
            ORDER BY ProductoID;
        OPEN cur_liberar;
        FETCH NEXT FROM cur_liberar INTO @ProductoID, @Cantidad;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            UPDATE dbo.Inventarios
            SET CantidadReservada = CantidadReservada - @Cantidad,
                CantidadDisponible = CantidadDisponible + @Cantidad
            WHERE ProductoID = @ProductoID AND CantidadReservada >= @Cantidad;
            IF @@ROWCOUNT <> 1
            BEGIN
                CLOSE cur_liberar;
                DEALLOCATE cur_liberar;
                THROW 51115, 'No se pudo liberar el inventario reservado.', 1;
            END;
            FETCH NEXT FROM cur_liberar INTO @ProductoID, @Cantidad;
        END;
        CLOSE cur_liberar;
        DEALLOCATE cur_liberar;

        UPDATE dbo.Pedidos SET EstadoPedidoID = @Cancelado
        WHERE PedidoID = @PedidoID;
        COMMIT TRANSACTION;
        EXEC dbo.sp_Pedidos_ConsultarPorID @PedidoID;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'cur_liberar') >= 0 CLOSE cur_liberar;
        IF CURSOR_STATUS('local', 'cur_liberar') >= -1 DEALLOCATE cur_liberar;
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
