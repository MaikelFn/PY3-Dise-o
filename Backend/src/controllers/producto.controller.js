const { sql, getPool } = require('../config/database');

function parseOptionalId(value) {
  if (value == null || value === '') return null;
  if (!/^[1-9]\d*$/.test(value)) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

async function listarProductos(req, res) {
  const categoriaID = parseOptionalId(req.query.categoriaId);
  const vendedorID = parseOptionalId(req.query.vendedorId);
  const busqueda = typeof req.query.busqueda === 'string'
    ? req.query.busqueda.trim()
    : '';

  if (categoriaID === undefined || vendedorID === undefined ||
      typeof req.query.busqueda === 'object' || busqueda.length > 150) {
    return res.status(400).json({ mensaje: 'Filtros de productos inválidos' });
  }

  try {
    const conexion = await getPool();
    const resultado = await conexion.request()
      .input('CategoriaID', sql.Int, categoriaID)
      .input('VendedorID', sql.Int, vendedorID)
      .input('Busqueda', sql.NVarChar(150), busqueda || null)
      .input('SoloActivos', sql.Bit, true)
      .execute('dbo.sp_Productos_Listar');

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar productos:', error);
    return res.status(500).json({ mensaje: 'Error al listar productos' });
  }
}

async function consultarProducto(req, res) {
  const productoID = parseOptionalId(req.params.id);
  if (!productoID) {
    return res.status(400).json({ mensaje: 'ID de producto inválido' });
  }

  try {
    const conexion = await getPool();
    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, productoID)
      .execute('dbo.sp_Productos_ConsultarPorID');

    if (!resultado.recordset.length) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error('Error al consultar producto:', error);
    return res.status(500).json({ mensaje: 'Error al consultar producto' });
  }
}

module.exports = { listarProductos, consultarProducto };
