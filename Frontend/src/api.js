const API_BASE_URL = '/api'

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined || isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const error = new Error(data?.mensaje || data?.error || `Error ${response.status}`)
    error.status = response.status
    throw error
  }

  return data
}

export const register = (details) =>
  apiRequest('/auth/registro', { method: 'POST', body: details })

export const login = (credentials) =>
  apiRequest('/auth/login', { method: 'POST', body: credentials })

export const getSession = async () => {
  try {
    const data = await apiRequest('/auth/sesion')
    return data.usuario
  } catch (error) {
    if (error.status === 401) return null
    throw error
  }
}

export const logout = () =>
  apiRequest('/auth/logout', { method: 'POST' })

export async function getCategories() {
  const data = await apiRequest('/categorias')
  if (!Array.isArray(data)) throw new Error('Formato inválido de categorías')
  return data
}

export const getCategory = (categoryId) =>
  apiRequest(`/categorias/${categoryId}`)

export async function getProducts({ categoryId, vendorId, search } = {}) {
  const params = new URLSearchParams()
  if (categoryId) params.set('categoriaID', categoryId)
  if (vendorId) params.set('vendedorID', vendorId)
  if (search?.trim()) params.set('busqueda', search.trim())

  const query = params.toString()
  const data = await apiRequest(`/productos${query ? `?${query}` : ''}`)
  if (!Array.isArray(data)) throw new Error('Formato inválido de productos')
  return data
}

export const getProduct = (productId) =>
  apiRequest(`/productos/${productId}`)

export const getProductImages = (productId) =>
  apiRequest(`/productos/${productId}/imagenes`)

export const getProductInventory = (productId) =>
  apiRequest(`/productos/${productId}/inventario`)

export const createProduct = (details) =>
  apiRequest('/productos', { method: 'POST', body: details })

export const addProductImage = (productId, details) =>
  apiRequest(`/productos/${productId}/imagenes`, { method: 'POST', body: details })

export const setMainProductImage = (imageId) =>
  apiRequest(`/imagenes/${imageId}/principal`, { method: 'PATCH' })

export const deleteProductImage = (imageId) =>
  apiRequest(`/imagenes/${imageId}`, { method: 'DELETE' })

export const addProductStock = (productId, cantidad) =>
  apiRequest(`/productos/${productId}/inventario`, {
    method: 'POST',
    body: { cantidad }
  })

export function resolveImageUrl(imageURL) {
  if (!imageURL) return ''
  if (imageURL.startsWith('/')) return imageURL
  if (imageURL.startsWith('http://') || imageURL.startsWith('https://')) return imageURL
  return `/imagenes/${imageURL}`
}

export async function getCartItems() {
  const data = await apiRequest('/carrito/detalles')
  if (!Array.isArray(data)) throw new Error('Formato inválido del carrito')
  return data
}

export async function addCartItem(productoID, cantidad = 1) {
  await apiRequest('/carrito/detalles', {
    method: 'POST',
    body: { productoID, cantidad }
  })
  return getCartItems()
}

export async function updateCartItem(productoID, cantidad) {
  await apiRequest(`/carrito/detalles/${productoID}`, {
    method: 'PUT',
    body: { cantidad }
  })
  return getCartItems()
}

export async function removeCartItem(productoID) {
  await apiRequest(`/carrito/detalles/${productoID}`, {
    method: 'DELETE'
  })
  return getCartItems()
}

export async function clearCart() {
  await apiRequest('/carrito', { method: 'DELETE' })
  return getCartItems()
}

export const getCart = () =>
  apiRequest('/carrito')

export const createCart = () =>
  apiRequest('/carrito', { method: 'POST' })

export async function getAddresses() {
  const data = await apiRequest('/direcciones')
  if (!Array.isArray(data)) throw new Error('Formato inválido de direcciones')
  return data
}

export const createAddress = (details) =>
  apiRequest('/direcciones', { method: 'POST', body: details })

export const updateAddress = (addressId, details) =>
  apiRequest(`/direcciones/${addressId}`, { method: 'PUT', body: details })

export const deleteAddress = (addressId) =>
  apiRequest(`/direcciones/${addressId}`, { method: 'DELETE' })

export async function getShippingTypes() {
  const data = await apiRequest('/tipos-envio')
  if (!Array.isArray(data)) throw new Error('Formato inválido de tipos de envío')
  return data
}

export const createOrder = (details) =>
  apiRequest('/pedidos', { method: 'POST', body: details })

export async function getOrders() {
  const data = await apiRequest('/pedidos')
  if (!Array.isArray(data)) throw new Error('Formato inválido de pedidos')
  return data
}

export const getOrder = (orderId) =>
  apiRequest(`/pedidos/${orderId}`)

export const cancelOrder = (orderId) =>
  apiRequest(`/pedidos/${orderId}/cancelar`, { method: 'POST' })

export const getOrderDetails = (orderId) =>
  apiRequest(`/pedidos/${orderId}/detalles`)

export const createSimulatedCheckout = (details) =>
  apiRequest('/pedidos/checkout-simulado', { method: 'POST', body: details })

export async function getSellers() {
  const data = await apiRequest('/vendedores')
  if (!Array.isArray(data)) throw new Error('Formato inválido de vendedores')
  return data
}

export const getSeller = (sellerId) =>
  apiRequest(`/vendedores/${sellerId}`)

export const createSeller = (details) =>
  apiRequest('/vendedores', { method: 'POST', body: details })

export const updateSeller = (sellerId, details) =>
  apiRequest(`/vendedores/${sellerId}`, { method: 'PUT', body: details })

export const deactivateSeller = (sellerId) =>
  apiRequest(`/vendedores/${sellerId}`, { method: 'DELETE' })

export async function getSellerOrders() {
  const data = await apiRequest('/pedidos/vendedor')
  if (!Array.isArray(data)) throw new Error('Formato inválido de pedidos de vendedor')
  return data
}

export async function publishProduct({ image, ...details }) {
  const body = new FormData()
  Object.entries(details).forEach(([key, value]) => body.append(key, String(value)))
  body.append('imagen', image)
  return apiRequest('/productos/publicar', { method: 'POST', body })
}

export const updateProduct = (productId, details) =>
  apiRequest(`/productos/${productId}`, { method: 'PUT', body: details })

export const deactivateProduct = (productId) =>
  apiRequest(`/productos/${productId}`, { method: 'DELETE' })

export async function getAdminOrders() {
  const data = await apiRequest('/pedidos/administracion')
  if (!Array.isArray(data)) throw new Error('Formato inválido de pedidos administrativos')
  return data
}

export const confirmOrder = (orderId) =>
  apiRequest(`/pedidos/${orderId}/confirmar`, { method: 'POST' })

export async function getOrderPayments(orderId) {
  const data = await apiRequest(`/pedidos/${orderId}/pagos`)
  if (!Array.isArray(data)) throw new Error('Formato inválido de pagos')
  return data
}

export const approvePayment = (paymentId) =>
  apiRequest(`/pagos/${paymentId}/aprobar`, { method: 'POST' })

export const rejectPayment = (paymentId) =>
  apiRequest(`/pagos/${paymentId}/rechazar`, { method: 'POST' })

export const getPayment = (paymentId) =>
  apiRequest(`/pagos/${paymentId}`)

export async function getOrderShipping(orderId) {
  return apiRequest(`/pedidos/${orderId}/envio`)
}

export const getShipping = (shippingId) =>
  apiRequest(`/envios/${shippingId}`)

export const updateShippingState = (shippingId, nuevoEstado) =>
  apiRequest(`/envios/${shippingId}/estado`, {
    method: 'PATCH',
    body: { nuevoEstado }
  })

export async function getRoles() {
  const data = await apiRequest('/roles')
  if (!Array.isArray(data)) throw new Error('Formato inválido de roles')
  return data
}

export const assignUserRole = (userId, rolID) =>
  apiRequest(`/usuarios/${userId}/rol`, {
    method: 'PATCH',
    body: { rolID }
  })

export const deactivateUser = (userId) =>
  apiRequest(`/usuarios/${userId}/desactivar`, { method: 'PATCH' })

export const getUser = (userId) =>
  apiRequest(`/usuarios/${userId}`)

export const updateUser = (userId, details) =>
  apiRequest(`/usuarios/${userId}`, { method: 'PUT', body: details })

export async function getUsers() {
  const data = await apiRequest('/usuarios')
  if (!Array.isArray(data)) throw new Error('Formato inválido de usuarios')
  return data
}

export const createCategory = (details) =>
  apiRequest('/categorias', { method: 'POST', body: details })

export const updateCategory = (categoryId, details) =>
  apiRequest(`/categorias/${categoryId}`, { method: 'PUT', body: details })

export async function getOrderStates() {
  const data = await apiRequest('/estados-pedido')
  if (!Array.isArray(data)) throw new Error('Formato inválido de estados de pedido')
  return data
}

export async function getPaymentMethods() {
  const data = await apiRequest('/metodos-pago')
  if (!Array.isArray(data)) throw new Error('Formato inválido de métodos de pago')
  return data
}

export const registerPayment = (pedidoID, metodoPagoID) =>
  apiRequest('/pagos', {
    method: 'POST',
    body: { pedidoID, metodoPagoID }
  })

export async function getNotifications({ unreadOnly = false } = {}) {
  const query = unreadOnly ? '?soloNoLeidas=true' : ''
  const data = await apiRequest(`/notificaciones${query}`)
  if (!Array.isArray(data)) throw new Error('Formato inválido de notificaciones')
  return data
}

export const markNotificationRead = (notificationId) =>
  apiRequest(`/notificaciones/${notificationId}/leida`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiRequest('/notificaciones/leidas/todas', { method: 'PATCH' })

export const getNotification = (notificationId) =>
  apiRequest(`/notificaciones/${notificationId}`)
