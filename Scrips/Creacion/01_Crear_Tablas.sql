
USE ClickMarketDB;
GO

-- ============================================
-- CLICKMARKET - MODELO COMPLETO
-- 18 TABLAS
-- ============================================

-- ============================================
-- 1. ROLES
-- ============================================

CREATE TABLE dbo.Roles (
    RolID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(30) NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL,

    CONSTRAINT CK_Roles_Nombre
        CHECK (Nombre IN (
            'Comprador',
            'Vendedor',
            'Administrador'
        ))
);
GO

-- ============================================
-- 2. USUARIOS
-- ============================================

CREATE TABLE dbo.Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    RolID INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    Correo NVARCHAR(150) NOT NULL UNIQUE,
    ContrasenaHash NVARCHAR(255) NOT NULL,
    FechaRegistro DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    Activo BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_Usuarios_Roles
        FOREIGN KEY (RolID)
        REFERENCES dbo.Roles(RolID)
);
GO

-- ============================================
-- 3. VENDEDORES
-- ============================================

CREATE TABLE dbo.Vendedores (
    VendedorID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NULL UNIQUE,
    NombreComercial NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    EsClickMarket BIT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_Vendedores_Usuarios
        FOREIGN KEY (UsuarioID)
        REFERENCES dbo.Usuarios(UsuarioID),

    CONSTRAINT CK_Vendedores_Tipo
        CHECK (
            (EsClickMarket = 1 AND UsuarioID IS NULL)
            OR
            (EsClickMarket = 0 AND UsuarioID IS NOT NULL)
        )
);
GO

CREATE UNIQUE INDEX UX_Vendedores_ClickMarket
ON dbo.Vendedores(EsClickMarket)
WHERE EsClickMarket = 1;
GO

-- ============================================
-- 4. DIRECCIONES
-- ============================================

CREATE TABLE dbo.Direcciones (
    DireccionID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    Provincia NVARCHAR(100) NOT NULL,
    Canton NVARCHAR(100) NOT NULL,
    Distrito NVARCHAR(100) NOT NULL,
    Detalle NVARCHAR(300) NOT NULL,
    Principal BIT NOT NULL DEFAULT 0,

    CONSTRAINT FK_Direcciones_Usuarios
        FOREIGN KEY (UsuarioID)
        REFERENCES dbo.Usuarios(UsuarioID),

    CONSTRAINT UQ_Direcciones_UsuarioDireccion
        UNIQUE (UsuarioID, DireccionID)
);
GO

CREATE UNIQUE INDEX UX_Direcciones_Principal
ON dbo.Direcciones(UsuarioID)
WHERE Principal = 1;
GO

-- ============================================
-- 5. CATEGORIAS
-- ============================================

CREATE TABLE dbo.Categorias (
    CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(300) NULL
);
GO

-- ============================================
-- 6. PRODUCTOS
-- ============================================

CREATE TABLE dbo.Productos (
    ProductoID INT IDENTITY(1,1) PRIMARY KEY,
    VendedorID INT NOT NULL,
    CategoriaID INT NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    Precio DECIMAL(12,2) NOT NULL,
    FechaCreacion DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    Activo BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_Productos_Vendedores
        FOREIGN KEY (VendedorID)
        REFERENCES dbo.Vendedores(VendedorID),

    CONSTRAINT FK_Productos_Categorias
        FOREIGN KEY (CategoriaID)
        REFERENCES dbo.Categorias(CategoriaID),

    CONSTRAINT CK_Productos_Precio
        CHECK (Precio >= 0)
);
GO

-- ============================================
-- 7. IMAGENES DE PRODUCTOS
-- ============================================

CREATE TABLE dbo.ImagenesProducto (
    ImagenID INT IDENTITY(1,1) PRIMARY KEY,
    ProductoID INT NOT NULL,
    ImagenURL NVARCHAR(500) NOT NULL,
    EsPrincipal BIT NOT NULL DEFAULT 0,
    Orden INT NOT NULL DEFAULT 0,

    CONSTRAINT FK_ImagenesProducto_Productos
        FOREIGN KEY (ProductoID)
        REFERENCES dbo.Productos(ProductoID),

    CONSTRAINT CK_ImagenesProducto_Orden
        CHECK (Orden >= 0)
);
GO

CREATE UNIQUE INDEX UX_ImagenesProducto_Principal
ON dbo.ImagenesProducto(ProductoID)
WHERE EsPrincipal = 1;
GO

-- ============================================
-- 8. INVENTARIOS
-- ============================================

CREATE TABLE dbo.Inventarios (
    InventarioID INT IDENTITY(1,1) PRIMARY KEY,
    ProductoID INT NOT NULL UNIQUE,
    CantidadDisponible INT NOT NULL DEFAULT 0,
    CantidadReservada INT NOT NULL DEFAULT 0,

    CONSTRAINT FK_Inventarios_Productos
        FOREIGN KEY (ProductoID)
        REFERENCES dbo.Productos(ProductoID),

    CONSTRAINT CK_Inventarios_Cantidades
        CHECK (
            CantidadDisponible >= 0
            AND CantidadReservada >= 0
        )
);
GO

-- ============================================
-- 9. CARRITOS
-- ============================================

CREATE TABLE dbo.Carritos (
    CarritoID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL UNIQUE,
    FechaCreacion DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Carritos_Usuarios
        FOREIGN KEY (UsuarioID)
        REFERENCES dbo.Usuarios(UsuarioID)
);
GO

-- ============================================
-- 10. DETALLES DEL CARRITO
-- ============================================

CREATE TABLE dbo.DetallesCarrito (
    DetalleCarritoID INT IDENTITY(1,1) PRIMARY KEY,
    CarritoID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL,

    CONSTRAINT FK_DetallesCarrito_Carritos
        FOREIGN KEY (CarritoID)
        REFERENCES dbo.Carritos(CarritoID),

    CONSTRAINT FK_DetallesCarrito_Productos
        FOREIGN KEY (ProductoID)
        REFERENCES dbo.Productos(ProductoID),

    CONSTRAINT UQ_DetallesCarrito_Producto
        UNIQUE (CarritoID, ProductoID),

    CONSTRAINT CK_DetallesCarrito_Cantidad
        CHECK (Cantidad > 0)
);
GO

-- ============================================
-- 11. ESTADOS DE PEDIDO
-- ============================================

CREATE TABLE dbo.EstadosPedido (
    EstadoPedidoID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(30) NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL,

    CONSTRAINT CK_EstadosPedido_Nombre
        CHECK (Nombre IN (
            'Pendiente',
            'Confirmado',
            'Enviado',
            'Entregado',
            'Cancelado'
        ))
);
GO

-- ============================================
-- 12. PEDIDOS
-- ============================================

CREATE TABLE dbo.Pedidos (
    PedidoID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    DireccionID INT NOT NULL,
    EstadoPedidoID INT NOT NULL,
    FechaPedido DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),
    Subtotal DECIMAL(12,2) NOT NULL,
    CostoEnvio DECIMAL(12,2) NOT NULL DEFAULT 0,
    Total DECIMAL(12,2) NOT NULL,

    CONSTRAINT FK_Pedidos_Usuarios
        FOREIGN KEY (UsuarioID)
        REFERENCES dbo.Usuarios(UsuarioID),

    CONSTRAINT FK_Pedidos_Direcciones_Usuario
        FOREIGN KEY (UsuarioID, DireccionID)
        REFERENCES dbo.Direcciones(UsuarioID, DireccionID),

    CONSTRAINT FK_Pedidos_Estados
        FOREIGN KEY (EstadoPedidoID)
        REFERENCES dbo.EstadosPedido(EstadoPedidoID),

    CONSTRAINT CK_Pedidos_Montos
        CHECK (
            Subtotal >= 0
            AND CostoEnvio >= 0
            AND Total = Subtotal + CostoEnvio
        )
);
GO

-- ============================================
-- 13. DETALLES DEL PEDIDO
-- ============================================

CREATE TABLE dbo.DetallesPedido (
    DetallePedidoID INT IDENTITY(1,1) PRIMARY KEY,
    PedidoID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    Subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT FK_DetallesPedido_Pedidos
        FOREIGN KEY (PedidoID)
        REFERENCES dbo.Pedidos(PedidoID),

    CONSTRAINT FK_DetallesPedido_Productos
        FOREIGN KEY (ProductoID)
        REFERENCES dbo.Productos(ProductoID),

    CONSTRAINT CK_DetallesPedido_Valores
        CHECK (
            Cantidad > 0
            AND PrecioUnitario >= 0
            AND Subtotal = Cantidad * PrecioUnitario
        )
);
GO

-- ============================================
-- 14. METODOS DE PAGO
-- ============================================

CREATE TABLE dbo.MetodosPago (
    MetodoPagoID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL
);
GO

-- ============================================
-- 15. PAGOS SIMULADOS
-- ============================================

CREATE TABLE dbo.Pagos (
    PagoID INT IDENTITY(1,1) PRIMARY KEY,
    PedidoID INT NOT NULL,
    MetodoPagoID INT NOT NULL,
    Monto DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    FechaPago DATETIME2 NULL,

    CONSTRAINT FK_Pagos_Pedidos
        FOREIGN KEY (PedidoID)
        REFERENCES dbo.Pedidos(PedidoID),

    CONSTRAINT FK_Pagos_Metodos
        FOREIGN KEY (MetodoPagoID)
        REFERENCES dbo.MetodosPago(MetodoPagoID),

    CONSTRAINT CK_Pagos_Estado
        CHECK (Estado IN (
            'Pendiente',
            'Aprobado',
            'Rechazado'
        )),

    CONSTRAINT CK_Pagos_Monto
        CHECK (Monto >= 0)
);
GO

-- ============================================
-- 16. TIPOS DE ENVIO
-- ============================================

CREATE TABLE dbo.TiposEnvio (
    TipoEnvioID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    CostoBase DECIMAL(10,2) NOT NULL,
    Descripcion NVARCHAR(200) NULL
);

-- ============================================
-- 17. ENVIOS
-- ============================================

CREATE TABLE dbo.Envios (
    EnvioID INT IDENTITY(1,1) PRIMARY KEY,
    PedidoID INT NOT NULL UNIQUE,
    TipoEnvioID INT NOT NULL,
    Costo DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    FechaEnvio DATETIME2 NULL,
    FechaEntrega DATETIME2 NULL,

    CONSTRAINT FK_Envios_Pedidos
        FOREIGN KEY (PedidoID)
        REFERENCES dbo.Pedidos(PedidoID),

    CONSTRAINT FK_Envios_Tipos
        FOREIGN KEY (TipoEnvioID)
        REFERENCES dbo.TiposEnvio(TipoEnvioID),

    CONSTRAINT CK_Envios_Estado
        CHECK (Estado IN (
            'Pendiente',
            'Preparando',
            'Enviado',
            'Entregado'
        )),

    CONSTRAINT CK_Envios_Costo
        CHECK (Costo >= 0),

    CONSTRAINT CK_Envios_Fechas
        CHECK (
            FechaEntrega IS NULL
            OR (
                FechaEnvio IS NOT NULL
                AND FechaEntrega >= FechaEnvio
            )
        )
);
GO

-- ============================================
-- 18. NOTIFICACIONES
-- ============================================

CREATE TABLE dbo.Notificaciones (
    NotificacionID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    PedidoID INT NULL,
    Titulo NVARCHAR(150) NOT NULL,
    Mensaje NVARCHAR(500) NOT NULL,
    Leida BIT NOT NULL DEFAULT 0,
    FechaCreacion DATETIME2 NOT NULL
        DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Notificaciones_Usuarios
        FOREIGN KEY (UsuarioID)
        REFERENCES dbo.Usuarios(UsuarioID),

    CONSTRAINT FK_Notificaciones_Pedidos
        FOREIGN KEY (PedidoID)
        REFERENCES dbo.Pedidos(PedidoID)
);
GO

-- ============================================
-- INDICES ADICIONALES
-- ============================================

CREATE INDEX IX_Productos_Categoria
ON dbo.Productos(CategoriaID);
GO

CREATE INDEX IX_Productos_Vendedor
ON dbo.Productos(VendedorID);
GO

CREATE INDEX IX_Pedidos_Usuario_Fecha
ON dbo.Pedidos(UsuarioID, FechaPedido DESC);
GO

CREATE INDEX IX_DetallesPedido_Pedido
ON dbo.DetallesPedido(PedidoID);
GO

CREATE INDEX IX_Pagos_Pedido
ON dbo.Pagos(PedidoID);
GO

CREATE INDEX IX_Notificaciones_Usuario_Leida
ON dbo.Notificaciones(UsuarioID, Leida);
GO

PRINT 'Modelo completo de ClickMarket creado.';
GO
