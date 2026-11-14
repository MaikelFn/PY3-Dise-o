
USE ClickMarketDB;
GO

-- ============================================
-- 1. ROLES
-- ============================================

INSERT INTO Roles (Nombre, Descripcion)
SELECT R.Nombre, R.Descripcion
FROM (VALUES
    ('Comprador', N'Usuario que realiza compras'),
    ('Vendedor', N'Usuario que administra sus productos'),
    ('Administrador', N'Usuario que administra ClickMarket')
) AS R(Nombre, Descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM Roles
    WHERE Nombre = R.Nombre
);

-- ============================================
-- 2. ESTADOS DE PEDIDO
-- ============================================

INSERT INTO EstadosPedido (Nombre, Descripcion)
SELECT E.Nombre, E.Descripcion
FROM (VALUES
    ('Pendiente', N'Pedido creado, pendiente de pago'),
    ('Confirmado', N'Pago aprobado'),
    ('Enviado', N'Pedido despachado'),
    ('Entregado', N'Pedido recibido'),
    ('Cancelado', N'Pedido cancelado')
) AS E(Nombre, Descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM EstadosPedido
    WHERE Nombre = E.Nombre
);

-- ============================================
-- 3. METODOS DE PAGO
-- ============================================

INSERT INTO MetodosPago (Nombre, Descripcion)
SELECT M.Nombre, M.Descripcion
FROM (VALUES
    ('Tarjeta', N'Pago simulado mediante tarjeta'),
    ('Transferencia', N'Pago simulado mediante transferencia')
) AS M(Nombre, Descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM MetodosPago
    WHERE Nombre = M.Nombre
);

-- ============================================
-- 4. TIPOS DE ENVIO
-- ============================================

INSERT INTO TiposEnvio (Nombre, Descripcion, CostoBase)
SELECT T.Nombre, T.Descripcion, T.CostoBase
FROM (VALUES
    ('Estandar', N'Entrega estándar', 1500.00),
    ('Expres', N'Entrega rápida', 3000.00)
) AS T(Nombre, Descripcion, CostoBase)
WHERE NOT EXISTS (
    SELECT 1 FROM TiposEnvio
    WHERE Nombre = T.Nombre
);

-- ============================================
-- 5. VENDEDOR OFICIAL
-- ============================================

IF NOT EXISTS (
    SELECT 1 FROM Vendedores
    WHERE EsClickMarket = 1
)
BEGIN
    INSERT INTO Vendedores (
        UsuarioID,
        NombreComercial,
        Descripcion,
        EsClickMarket,
        Activo
    )
    VALUES (
        NULL,
        N'ClickMarket',
        N'Tienda oficial de ClickMarket',
        1,
        1
    );
END;

-- ============================================
-- 6. CATEGORIAS
-- ============================================

INSERT INTO Categorias (Nombre, Descripcion)
SELECT C.Nombre, C.Descripcion
FROM (VALUES
    (N'Electrónica', N'Dispositivos electrónicos'),
    (N'Computación', N'Computadoras y accesorios'),
    (N'Hogar', N'Artículos para el hogar'),
    (N'Ropa', N'Prendas de vestir'),
    (N'Deportes', N'Artículos deportivos'),
    (N'Libros', N'Libros y material educativo')
) AS C(Nombre, Descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM Categorias
    WHERE Nombre = C.Nombre
);

PRINT 'Datos iniciales insertados correctamente.';
GO
