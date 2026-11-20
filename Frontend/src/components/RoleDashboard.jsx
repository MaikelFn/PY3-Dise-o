import { useEffect, useMemo, useRef, useState } from 'react'
import clickMarketLogo from '../assets/clickmarket-logo.png'
import {
  createCategory,
  createSeller,
  deactivateProduct,
  getAdminOrders,
  getOrders,
  getProducts,
  getSellerOrders,
  getSellers,
  getUser,
  publishProduct,
  resolveImageUrl,
  updateCategory,
  updateProduct
} from '../api'
import Icon from './Icon'
import './RoleDashboard.css'

const roleDetails = {
  buyer: {
    name: 'Comprador',
    heading: 'Tu espacio de compras',
    navigation: [
      { id: 'overview', label: 'Resumen', icon: 'dashboard' },
      { id: 'orders', label: 'Mis pedidos', icon: 'clipboard', group: 'MIS COMPRAS' },
      { id: 'favorites', label: 'Favoritos', icon: 'heart' },
      { id: 'profile', label: 'Mi perfil', icon: 'user', group: 'MI CUENTA' }
    ]
  },
  seller: {
    name: 'Vendedor',
    heading: 'Panel de tu tienda',
    navigation: [
      { id: 'overview', label: 'Resumen', icon: 'dashboard' },
      { id: 'products', label: 'Mis productos', icon: 'box', group: 'MI TIENDA' },
      { id: 'orders', label: 'Pedidos recibidos', icon: 'clipboard' },
      { id: 'store', label: 'Perfil de tienda', icon: 'settings' }
    ]
  },
  admin: {
    name: 'Administrador',
    heading: 'Panel de administración',
    navigation: [
      { id: 'overview', label: 'Resumen', icon: 'dashboard' },
      { id: 'catalog', label: 'Catálogo', icon: 'box', group: 'GESTIÓN' },
      { id: 'orders', label: 'Pedidos', icon: 'clipboard' },
      { id: 'categories', label: 'Categorías', icon: 'grid', group: 'CONFIGURACIÓN' }
    ]
  }
}

const dashboardDataStrategies = {
  buyer: async (userId) => {
    const [orders, userResponse] = await Promise.all([
      getOrders(),
      getUser(userId)
    ])
    return {
      orders,
      roleOrders: [],
      profile: userResponse.usuario,
      seller: null,
      sellerProducts: []
    }
  },
  seller: async (userId) => {
    const sellers = await getSellers()
    const seller = sellers.find((item) => Number(item.UsuarioID) === Number(userId))

    if (!seller) {
      return {
        orders: [],
        roleOrders: [],
        profile: null,
        seller: null,
        sellerProducts: []
      }
    }

    const [sellerProducts, roleOrders] = await Promise.all([
      getProducts({ vendorId: seller.VendedorID }),
      getSellerOrders()
    ])
    return {
      orders: [],
      roleOrders,
      profile: null,
      seller,
      sellerProducts
    }
  },
  admin: async (_userId) => ({
    orders: [],
    roleOrders: await getAdminOrders(),
    profile: null,
    seller: null,
    sellerProducts: []
  })
}

const money = (value) => new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
}).format(Number(value) || 0)

function date(value) {
  const parsed = value ? new Date(value) : null
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(parsed)
    : '—'
}

function isOrderPaymentConfirmed(status) {
  const normalized = String(status || '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return ['confirmado', 'pagado', 'enviado', 'despachado', 'entregado']
    .some((value) => normalized.includes(value))
}

function RoleDashboard({ role, user, categories, products, onExit, onSwitchRole, onCatalogChanged }) {
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [orders, setOrders] = useState([])
  const [roleOrders, setRoleOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [seller, setSeller] = useState(null)
  const [sellerProducts, setSellerProducts] = useState([])
  const simulatedIncome = useMemo(
    () => roleOrders.reduce(
      (total, order) => isOrderPaymentConfirmed(order.Estado)
        ? total + Number(order.SubtotalVendedor || 0)
        : total,
      0
    ),
    [roleOrders]
  )
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [productForm, setProductForm] = useState({ categoriaID: '', nombre: '', descripcion: '', precio: '', cantidad: '' })
  const [productImage, setProductImage] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const productImagePreviewURL = useRef('')
  const [sellerForm, setSellerForm] = useState({ nombreComercial: '', descripcion: '' })
  const [categoryForm, setCategoryForm] = useState({ id: null, nombre: '', descripcion: '' })
  const [busy, setBusy] = useState(false)
  const noticeTimeout = useRef(null)
  const details = roleDetails[role]
  const initials = `${user.nombre?.[0] || ''}${user.apellido?.[0] || ''}`.toUpperCase() || 'U'
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [Number(category.id), category.name])),
    [categories]
  )

  useEffect(() => {
    let active = true
    const loadStrategy = dashboardDataStrategies[role]

    async function loadRoleData() {
      setLoading(true)
      setError('')
      try {
        if (!loadStrategy) {
          throw new Error('No hay una estrategia de carga configurada para este rol.')
        }

        const data = await loadStrategy(user.id)
        if (active) {
          setOrders(data.orders)
          setProfile(data.profile)
          setSeller(data.seller)
          setSellerProducts(data.sellerProducts)
          setRoleOrders(data.roleOrders)
        }
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRoleData()
    return () => { active = false }
  }, [retryToken, role, user.id])

  useEffect(() => () => {
    if (productImagePreviewURL.current) {
      URL.revokeObjectURL(productImagePreviewURL.current)
    }
    window.clearTimeout(noticeTimeout.current)
  }, [])

  function showNotice(message) {
    setNotice(message)
    window.clearTimeout(noticeTimeout.current)
    noticeTimeout.current = window.setTimeout(() => setNotice(''), 2800)
  }

  function retry() {
    setRetryToken((current) => current + 1)
  }

  function selectProductImage(file) {
    if (productImagePreviewURL.current) {
      URL.revokeObjectURL(productImagePreviewURL.current)
    }
    productImagePreviewURL.current = file ? URL.createObjectURL(file) : ''
    setProductImage(file)
    setProductImagePreview(productImagePreviewURL.current)
  }

  function beginProductEdit(product) {
    setEditingProductId(product.ProductoID)
    selectProductImage(null)
    setProductForm({
      categoriaID: String(product.CategoriaID),
      nombre: product.Nombre,
      descripcion: product.Descripcion || '',
      precio: String(product.Precio),
      cantidad: ''
    })
    setProductFormOpen(true)
  }

  function beginNewProduct() {
    setEditingProductId(null)
    selectProductImage(null)
    setProductForm({ categoriaID: '', nombre: '', descripcion: '', precio: '', cantidad: '' })
    setProductFormOpen(true)
  }

  function closeProductForm() {
    setProductFormOpen(false)
    selectProductImage(null)
  }

  async function saveProduct(event) {
    event.preventDefault()
    if (!editingProductId && !productImage) {
      setError('Selecciona una foto para publicar el producto.')
      return
    }
    if (productImage && productImage.size > 5 * 1024 * 1024) {
      setError('La foto no puede superar 5 MB.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const detailsToSave = {
        categoriaID: Number(productForm.categoriaID),
        nombre: productForm.nombre.trim(),
        descripcion: productForm.descripcion.trim(),
        precio: Number(productForm.precio)
      }
      if (editingProductId) {
        await updateProduct(editingProductId, detailsToSave)
      } else {
        await publishProduct({
          ...detailsToSave,
          cantidad: Number(productForm.cantidad),
          image: productImage
        })
      }
      const refreshedProducts = await getProducts({ vendorId: seller.VendedorID })
      setSellerProducts(refreshedProducts)
      await onCatalogChanged()
      setProductFormOpen(false)
      setEditingProductId(null)
      setProductForm({ categoriaID: '', nombre: '', descripcion: '', precio: '', cantidad: '' })
      selectProductImage(null)
      showNotice(editingProductId ? 'Producto actualizado.' : 'Producto publicado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeProduct(productId) {
    if (!window.confirm('¿Quieres desactivar este producto?')) return
    setBusy(true)
    setError('')
    try {
      await deactivateProduct(productId)
      setSellerProducts(await getProducts({ vendorId: seller.VendedorID }))
      await onCatalogChanged()
      showNotice('Producto desactivado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveSeller(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createSeller({
        nombreComercial: sellerForm.nombreComercial.trim(),
        descripcion: sellerForm.descripcion.trim()
      })
      retry()
      showNotice('Perfil de tienda creado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveCategory(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const categoryDetails = {
        nombre: categoryForm.nombre.trim(),
        descripcion: categoryForm.descripcion.trim()
      }
      if (categoryForm.id) {
        await updateCategory(categoryForm.id, categoryDetails)
      } else {
        await createCategory(categoryDetails)
      }
      await onCatalogChanged()
      setCategoryForm({ id: null, nombre: '', descripcion: '' })
      showNotice(categoryForm.id ? 'Categoría actualizada.' : 'Categoría creada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function renderOrders() {
    if (!orders.length) {
      return <EmptyPanel title="Aún no tienes pedidos" message="Tus pedidos aparecerán aquí cuando completes una compra." />
    }
    return (
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Mis pedidos</h2><p>Historial asociado a tu cuenta.</p></div><span className="count-pill">{orders.length} pedidos</span></div>
        <div className="table-scroll">
          <table className="dashboard-table">
            <thead><tr><th>Pedido</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.PedidoID}>
                <td><strong className="table-primary">#{order.PedidoID}</strong></td>
                <td>{date(order.FechaPedido)}</td>
                <td>{order.Estado || 'Pendiente'}</td>
                <td><strong className="table-primary">{money(order.Total)}</strong></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    )
  }

  function renderRoleOrders() {
    const isAdmin = role === 'admin'
    return (
      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>{isAdmin ? 'Pedidos del marketplace' : 'Pedidos de mi tienda'}</h2>
            <p>{isAdmin ? 'Pedidos de todos los compradores.' : 'Pedidos con productos de tu tienda; el ingreso se confirma al aprobar el pago simulado.'}</p>
          </div>
          <div className="panel-heading-actions">
            <span className="count-pill">{roleOrders.length} pedidos</span>
            <button className="dashboard-secondary-button" disabled={loading} onClick={retry} type="button">
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>
        {roleOrders.length === 0 ? (
          <div className="dashboard-empty-panel">
            <h2>{isAdmin ? 'Aún no hay pedidos' : 'Aún no hay ventas'}</h2>
            <p>{isAdmin
              ? 'Los pedidos registrados aparecerán aquí.'
              : 'Los pedidos que incluyan productos de tu tienda aparecerán aquí.'}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Comprador</th>
                  <th>Unidades</th>
                  <th>Estado</th>
                  <th>{isAdmin ? 'Total' : 'Ingreso simulado'}</th>
                </tr>
              </thead>
              <tbody>{roleOrders.map((order) => (
                <tr key={order.PedidoID}>
                  <td><strong className="table-primary">#{order.PedidoID}</strong></td>
                  <td>{date(order.FechaPedido)}</td>
                  <td>{order.Comprador}</td>
                  <td>{order.CantidadProductos}</td>
                  <td>{order.Estado}</td>
                  <td><strong className="table-primary">{isAdmin
                    ? money(order.Total)
                    : isOrderPaymentConfirmed(order.Estado)
                      ? money(order.SubtotalVendedor)
                      : 'Pendiente'}</strong></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    )
  }

  function renderSellerProducts() {
    if (!seller) {
      return (
        <section className="dashboard-panel">
          <div className="panel-heading"><div><h2>Configura tu tienda</h2><p>Completa el perfil para comenzar a administrar tus productos.</p></div></div>
          <form className="dashboard-form" onSubmit={saveSeller}>
            <label>Nombre comercial<input maxLength="150" onChange={(event) => setSellerForm({ ...sellerForm, nombreComercial: event.target.value })} required value={sellerForm.nombreComercial} /></label>
            <label>Descripción<textarea maxLength="500" onChange={(event) => setSellerForm({ ...sellerForm, descripcion: event.target.value })} rows="3" value={sellerForm.descripcion} /></label>
            <button className="dashboard-primary-button" disabled={busy} type="submit">{busy ? 'Guardando…' : 'Crear perfil de tienda'}</button>
          </form>
        </section>
      )
    }

    return (
      <div className="dashboard-stack">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div><h2>{seller.NombreComercial}</h2><p>{seller.Descripcion || 'Administra los productos de tu tienda.'}</p></div>
            <button className="dashboard-primary-button" onClick={() => productFormOpen ? closeProductForm() : beginNewProduct()} type="button"><Icon name="plus" size={16} /> Nuevo producto</button>
          </div>
          {productFormOpen && (
            <form className="dashboard-form product-editor" onSubmit={saveProduct}>
              <label>Nombre<input maxLength="150" onChange={(event) => setProductForm({ ...productForm, nombre: event.target.value })} required value={productForm.nombre} /></label>
              <label>Categoría<select onChange={(event) => setProductForm({ ...productForm, categoriaID: event.target.value })} required value={productForm.categoriaID}>
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select></label>
              <label>Precio (₡)<input min="1" onChange={(event) => setProductForm({ ...productForm, precio: event.target.value })} required step="1" type="number" value={productForm.precio} /></label>
              <label>Descripción<textarea maxLength="1000" onChange={(event) => setProductForm({ ...productForm, descripcion: event.target.value })} rows="3" value={productForm.descripcion} /></label>
              {!editingProductId && (
                <>
                  <label>Existencias iniciales<input min="1" onChange={(event) => setProductForm({ ...productForm, cantidad: event.target.value })} required step="1" type="number" value={productForm.cantidad} /></label>
                  <label>Foto del producto<input accept="image/jpeg,image/png,image/webp" onChange={(event) => selectProductImage(event.target.files?.[0] || null)} required type="file" /></label>
                  <small className="product-image-help">JPG, PNG o WebP · máximo 5 MB</small>
                  {productImage && productImagePreview && <img alt="Vista previa del producto" className="product-image-preview" src={productImagePreview} />}
                </>
              )}
              <div className="dashboard-form-actions"><button className="dashboard-primary-button" disabled={busy} type="submit">{busy ? 'Guardando…' : editingProductId ? 'Guardar cambios' : 'Publicar producto'}</button><button className="dashboard-secondary-button" onClick={closeProductForm} type="button">Cancelar</button></div>
            </form>
          )}
        </section>
        {sellerProducts.length ? (
          <section className="dashboard-panel">
            <div className="panel-heading"><div><h2>Mis productos</h2><p>Productos devueltos por el catálogo de la API.</p></div><span className="count-pill">{sellerProducts.length} productos</span></div>
            <div className="table-scroll"><table className="dashboard-table">
              <thead><tr><th>Foto</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Existencias</th><th>Acciones</th></tr></thead>
              <tbody>{sellerProducts.map((product) => (
                <tr key={product.ProductoID}>
                  <td>{product.ImagenURL && <img alt="" className="seller-product-thumb" src={resolveImageUrl(product.ImagenURL)} />}</td>
                  <td><strong>{product.Nombre}</strong></td>
                  <td>{categoryNames.get(Number(product.CategoriaID)) || 'Sin categoría'}</td>
                  <td><strong className="table-primary">{money(product.Precio)}</strong></td>
                  <td>{Number(product.CantidadDisponible) || 0}</td>
                  <td className="dashboard-row-actions"><button className="row-action" disabled={busy} onClick={() => beginProductEdit(product)} type="button">Editar</button><button className="row-action" disabled={busy} onClick={() => removeProduct(product.ProductoID)} type="button">Desactivar</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          </section>
        ) : (
          <EmptyPanel title="Aún no tienes productos" message="Publica tu primer producto para mostrarlo en el catálogo." />
        )}
      </div>
    )
  }

  function renderCategories() {
    return (
      <div className="dashboard-stack">
        <section className="dashboard-panel">
          <div className="panel-heading"><div><h2>{categoryForm.id ? 'Editar categoría' : 'Crear categoría'}</h2><p>Los cambios se guardarán mediante la API.</p></div></div>
          <form className="dashboard-form" onSubmit={saveCategory}>
            <label>Nombre<input maxLength="100" onChange={(event) => setCategoryForm({ ...categoryForm, nombre: event.target.value })} required value={categoryForm.nombre} /></label>
            <label>Descripción<textarea maxLength="500" onChange={(event) => setCategoryForm({ ...categoryForm, descripcion: event.target.value })} rows="3" value={categoryForm.descripcion} /></label>
            <div className="dashboard-form-actions"><button className="dashboard-primary-button" disabled={busy} type="submit">{busy ? 'Guardando…' : categoryForm.id ? 'Guardar categoría' : 'Crear categoría'}</button>{categoryForm.id && <button className="dashboard-secondary-button" onClick={() => setCategoryForm({ id: null, nombre: '', descripcion: '' })} type="button">Cancelar</button>}</div>
          </form>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading"><div><h2>Categorías disponibles</h2><p>Listado actual del catálogo.</p></div><span className="count-pill">{categories.length}</span></div>
          <div className="table-scroll"><table className="dashboard-table">
            <thead><tr><th>Categoría</th><th>Descripción</th><th></th></tr></thead>
            <tbody>{categories.map((category) => (
              <tr key={category.id}><td><strong>{category.name}</strong></td><td>{category.description || '—'}</td><td><button className="row-action" onClick={() => setCategoryForm({ id: category.id, nombre: category.name, descripcion: category.description })} type="button">Editar</button></td></tr>
            ))}</tbody>
          </table></div>
        </section>
      </div>
    )
  }

  function renderProfile() {
    const account = profile || {}
    return (
      <section className="dashboard-panel profile-panel">
        <div className="panel-heading"><div><h2>Mi perfil</h2><p>Datos vinculados a tu cuenta.</p></div></div>
        <div className="profile-summary"><div className="profile-avatar">{initials}</div><div><strong>{account.Nombre || user.nombre} {account.Apellido || user.apellido}</strong><span>{account.Correo || user.correo}</span></div></div>
        <div className="profile-fields"><div><span>Tipo de cuenta</span><strong>{account.Rol || user.rol}</strong></div><div><span>Miembro desde</span><strong>{date(account.FechaRegistro)}</strong></div></div>
      </section>
    )
  }

  function renderContent() {
    if (loading) return <EmptyPanel title="Cargando tu espacio…" message="Consultando la información de tu cuenta." />
    if (error) return <EmptyPanel title="No se pudo cargar esta sección" message={error} action={<button className="dashboard-primary-button" onClick={retry} type="button">Reintentar</button>} />

    if (role === 'buyer') {
      if (activeSection === 'orders') return renderOrders()
      if (activeSection === 'profile') return renderProfile()
      if (activeSection === 'favorites') return <EmptyPanel title="Favoritos" message="El backend actual no ofrece una ruta para guardar favoritos. Esta sección se habilitará cuando exista ese endpoint." />
      if (activeSection === 'overview') {
        return (
          <div className="dashboard-stack">
            <div className="stats-grid">
              <StatCard label="Pedidos registrados" value={orders.length} icon="clipboard" tone="stat-blue" />
              <StatCard label="Cuenta" value="Comprador" icon="user" tone="stat-orange" />
            </div>
            {orders.length ? renderOrders() : <EmptyPanel title="Tu actividad aparecerá aquí" message="Cuando completes una compra, podrás revisar tus pedidos desde este panel." />}
          </div>
        )
      }
    }

    if (role === 'seller') {
      if (activeSection === 'products') return renderSellerProducts()
      if (activeSection === 'orders') return renderRoleOrders()
      if (activeSection === 'store') return seller
        ? <section className="dashboard-panel profile-panel"><div className="panel-heading"><div><h2>Perfil de tienda</h2><p>Información que devuelve el backend.</p></div></div><div className="profile-fields"><div><span>Nombre comercial</span><strong>{seller.NombreComercial}</strong></div><div><span>Descripción</span><strong>{seller.Descripcion || '—'}</strong></div></div></section>
        : renderSellerProducts()
      if (activeSection === 'overview') {
        return (
          <div className="dashboard-stack">
            <div className="stats-grid">
              <StatCard label="Productos publicados" value={sellerProducts.length} icon="box" tone="stat-blue" />
              <StatCard label="Pedidos recibidos" value={roleOrders.length} icon="clipboard" tone="stat-orange" />
              <StatCard label="Ingresos simulados" value={money(simulatedIncome)} icon="chart" tone="stat-green" />
            </div>
            {renderRoleOrders()}
            {renderSellerProducts()}
          </div>
        )
      }
    }

    if (role === 'admin') {
      if (activeSection === 'orders') return renderRoleOrders()
      if (activeSection === 'catalog') {
        return products.length ? (
          <section className="dashboard-panel"><div className="panel-heading"><div><h2>Catálogo del marketplace</h2><p>Productos activos obtenidos de la API.</p></div><span className="count-pill">{products.length}</span></div>
            <div className="table-scroll"><table className="dashboard-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Vendedor</th><th>Precio</th></tr></thead><tbody>
              {products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.category}</td><td>#{product.sellerId}</td><td><strong className="table-primary">{money(product.price)}</strong></td></tr>)}
            </tbody></table></div>
          </section>
        ) : <EmptyPanel title="El catálogo está vacío" message="No hay productos activos registrados en la API." />
      }
      if (activeSection === 'categories') return renderCategories()
      if (activeSection === 'overview') {
        return (
          <div className="dashboard-stack">
            <div className="stats-grid">
              <StatCard label="Productos activos" value={products.length} icon="box" tone="stat-blue" />
              <StatCard label="Categorías" value={categories.length} icon="grid" tone="stat-orange" />
              <StatCard label="Pedidos registrados" value={roleOrders.length} icon="clipboard" tone="stat-green" />
            </div>
            {renderRoleOrders()}
          </div>
        )
      }
    }

    return <EmptyPanel title="Sección no disponible" message="No hay una vista configurada para esta sección." />
  }

  return (
    <div className={`role-dashboard role-${role}`}>
      <aside className="dashboard-sidebar">
        <a aria-label="ClickMarket" className="dashboard-brand" href="/"><img alt="ClickMarket" src={clickMarketLogo} /></a>
        <div className="dashboard-role"><span className="dashboard-role-icon"><Icon name={role === 'admin' ? 'shield' : role === 'seller' ? 'store' : 'user'} size={18} /></span><span><small>ESPACIO DE</small><strong>{details.name}</strong></span></div>
        <nav aria-label={`Apartados para ${details.name}`} className="dashboard-navigation">
          {details.navigation.map((item) => (
            <div key={item.id}>
              {item.group && <span className="dashboard-nav-group">{item.group}</span>}
              <button aria-current={activeSection === item.id ? 'page' : undefined} className={`dashboard-nav-link${activeSection === item.id ? ' is-active' : ''}`} onClick={() => setActiveSection(item.id)} type="button">
                <Icon name={item.icon} size={18} /><span>{item.label}</span>
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span><Icon name="support" size={18} /></span><strong>¿Necesitas ayuda?</strong><small>Estamos para apoyarte</small><button onClick={() => showNotice('Contáctanos desde el centro de ayuda.')} type="button">Centro de ayuda <Icon name="arrow" size={13} /></button></div>
          <button className="sidebar-logout" onClick={onExit} type="button"><Icon name="logout" size={17} /> Volver a la tienda</button>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb"><span>ClickMarket</span><Icon name="chevron" size={15} /><strong>{details.name}</strong></div>
          <div className="dashboard-top-actions">
            <span className="dashboard-connected"><i /> Sesión activa</span>
            <button className="dashboard-user-menu" onClick={onSwitchRole} type="button"><span className="user-initials">{initials}</span><span><strong>{user.nombre} {user.apellido}</strong><small>{details.name}</small></span><Icon name="chevron" size={15} /></button>
          </div>
        </header>

        <main className="dashboard-main" id="panel">
          <div className="dashboard-welcome">
            <div><span className="eyebrow">TU ESPACIO CLICKMARKET</span><h1>Hola, {user.nombre}</h1><p>{details.heading}</p></div>
            <button className="switch-role-button" onClick={onSwitchRole} type="button"><Icon name="user" size={16} /> Mi cuenta</button>
          </div>
          <div className="dashboard-page-heading"><div><h2>{details.navigation.find((item) => item.id === activeSection)?.label || details.heading}</h2><span>Información sincronizada con ClickMarket</span></div></div>
          {renderContent()}
        </main>
      </div>
      <div aria-atomic="true" aria-live="polite" className={`dashboard-toast${notice ? ' is-visible' : ''}`} role="status">{notice}</div>
    </div>
  )
}

function StatCard({ label, value, icon, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} size={19} /></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-change">Datos actuales</span></article>
}

function EmptyPanel({ title, message, action }) {
  return <section className="dashboard-panel dashboard-empty-panel"><h2>{title}</h2><p>{message}</p>{action}</section>
}

export default RoleDashboard
