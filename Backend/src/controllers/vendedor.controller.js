const { getPool } = require('../config/database');

// Listar vendedores
async function listarVendedores(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_vendedores_listar($1)',
      [true]
    );

    const vendedores = resultado.rows.map(v => ({
      VendedorID: v.vendedorid,
      UsuarioID: v.usuarioid,
      NombreComercial: v.nombrecomercial,
      Descripcion: v.descripcion,
      Activo: v.activo
    }));

    return res.json(vendedores);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar vendedores'
    });
  }
}

// Consultar vendedor
async function consultarVendedor(req, res) {
  try {
    const id = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_vendedores_consultarporid($1)',
      [id]
    );

    if (!resultado.rows.length || !resultado.rows[0].activo) {
      return res.status(404).json({
        mensaje: 'Vendedor no encontrado'
      });
    }

    const v = resultado.rows[0];

    return res.json({
      VendedorID: v.vendedorid,
      UsuarioID: v.usuarioid,
      NombreComercial: v.nombrecomercial,
      Descripcion: v.descripcion,
      Activo: v.activo
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar vendedor'
    });
  }
}

// Registrar vendedor
async function registrarVendedor(req, res) {
  try {
    const { nombreComercial, descripcion } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_vendedores_registrar($1, $2, $3)',
      [
        req.session.usuario.id,
        nombreComercial.trim(),
        descripcion ?? null
      ]
    );

    const v = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Vendedor registrado correctamente',
      vendedor: {
        VendedorID: v.vendedorid,
        UsuarioID: v.usuarioid,
        NombreComercial: v.nombrecomercial,
        Descripcion: v.descripcion,
        Activo: v.activo
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al registrar vendedor'
    });
  }
}

// Actualizar vendedor
async function actualizarVendedor(req, res) {
  try {
    const id = Number(req.params.id);
    const { nombreComercial, descripcion } = req.body;

    const conexion = await getPool();

    const propietario = await conexion.query(
      'SELECT * FROM public.sp_vendedores_validarpropietario($1, $2)',
      [id, req.session.usuario.id]
    );

    if (!propietario.rows.length) {
      return res.status(403).json({
        mensaje: 'No puede modificar este vendedor'
      });
    }

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_vendedores_actualizar($1, $2, $3)',
      [id, nombreComercial.trim(), descripcion ?? null]
    );

    const v = resultado.rows[0];

    return res.json({
      mensaje: 'Vendedor actualizado correctamente',
      vendedor: {
        VendedorID: v.vendedorid,
        UsuarioID: v.usuarioid,
        NombreComercial: v.nombrecomercial,
        Descripcion: v.descripcion,
        Activo: v.activo
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al actualizar vendedor'
    });
  }
}

// Desactivar vendedor
async function desactivarVendedor(req, res) {
  try {
    const id = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_vendedores_desactivar($1)',
      [id]
    );

    const v = resultado.rows[0];

    return res.json({
      mensaje: 'Vendedor desactivado correctamente',
      vendedor: {
        VendedorID: v.vendedorid,
        UsuarioID: v.usuarioid,
        NombreComercial: v.nombrecomercial,
        Descripcion: v.descripcion,
        Activo: v.activo
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al desactivar vendedor'
    });
  }
}

module.exports = {
  listarVendedores,
  consultarVendedor,
  registrarVendedor,
  actualizarVendedor,
  desactivarVendedor
};
