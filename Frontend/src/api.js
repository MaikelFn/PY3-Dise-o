const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const API_ORIGIN = /^https?:\/\//i.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : ''

export function resolveImageUrl(imageURL) {
  if (!imageURL) return ''
  if (!imageURL.startsWith('/') || !API_ORIGIN) return imageURL
  return new URL(imageURL, API_ORIGIN).toString()
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let response
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined || isFormData
        ? undefined
        : { 'Content-Type': 'application/json' },
      body: body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
      signal
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('No se pudo conectar con ClickMarket. Verifica que la API esté iniciada.', 0)
  }

  const contentType = response.headers.get('content-type') || ''
  const data = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : null

  if (!response.ok) {
    throw new ApiError(
      data?.mensaje || data?.message || data?.error || `La solicitud falló (${response.status})`,
      response.status
    )
  }

  return data
}

async function getList(path, options) {
  const data = await apiRequest(path, options)
  if (!Array.isArray(data)) {
    throw new ApiError(`La API devolvió un formato inválido para ${path}.`, 502)
  }
  return data
}

export const getCategories = ({ signal } = {}) =>
  getList('/categorias', { signal })

export function getProducts({ categoryId, vendorId, search, signal } = {}) {
  const params = new URLSearchParams()
  if (categoryId != null) params.set('categoriaID', categoryId)
  if (vendorId != null) params.set('vendedorID', vendorId)
  if (search?.trim()) params.set('busqueda', search.trim())

  const query = params.toString()
  return getList(`/productos${query ? `?${query}` : ''}`, { signal })
}

export const getSession = async ({ signal } = {}) => {
  try {
    const data = await apiRequest('/auth/sesion', { signal })
    return data.usuario
  } catch (error) {
    if (error.status === 401) return null
    throw error
  }
}

export const login = (credentials) =>
  apiRequest('/auth/login', { method: 'POST', body: credentials })

export const register = (details) =>
  apiRequest('/auth/registro', { method: 'POST', body: details })

export const logout = () =>
  apiRequest('/auth/logout', { method: 'POST' })

export const getCartItems = () =>
  getList('/carrito/detalles').then((items) => items.map((item) => ({
    ...item,
    ProductoID: item.ProductoID ?? item.productoid,
    Producto: item.Producto ?? item.producto,
    Precio: item.Precio ?? item.precio,
    Cantidad: item.Cantidad ?? item.cantidad,
    Subtotal: item.Subtotal ?? item.subtotal,
    CantidadDisponible: item.CantidadDisponible ?? item.cantidaddisponible
  })))

async function updateCartAndReload(path, options) {
  await apiRequest(path, options)
  return getCartItems()
}

export const addCartItem = (productoID, cantidad = 1) =>
  updateCartAndReload('/carrito/detalles', {
    method: 'POST',
    body: { productoID, cantidad }
  })

export const updateCartItem = (productoID, cantidad) =>
  updateCartAndReload(`/carrito/detalles/${productoID}`, {
    method: 'PUT',
    body: { cantidad }
  })

export const removeCartItem = (productoID) =>
  updateCartAndReload(`/carrito/detalles/${productoID}`, { method: 'DELETE' })

export const getOrders = () =>
  getList('/pedidos')

export const getSellerOrders = () =>
  getList('/pedidos/vendedor')

export const getAdminOrders = () =>
  getList('/pedidos/administracion')

export const getAddresses = () =>
  getList('/direcciones')

export const createAddress = (details) =>
  apiRequest('/direcciones', { method: 'POST', body: details })

export const getShippingTypes = () =>
  getList('/tipos-envio')

export const createOrder = (details) =>
  apiRequest('/pedidos', { method: 'POST', body: details })

export const getUser = (userId) =>
  apiRequest(`/usuarios/${userId}`)

export const getSellers = () =>
  getList('/vendedores')

export const createSeller = (details) =>
  apiRequest('/vendedores', { method: 'POST', body: details })

export const createProduct = (details) =>
  apiRequest('/productos', { method: 'POST', body: details })

export function publishProduct({ image, ...details }) {
  const body = new FormData()
  Object.entries(details).forEach(([key, value]) => body.append(key, value))
  body.append('imagen', image)
  return apiRequest('/productos/publicar', { method: 'POST', body })
}

export const updateProduct = (productId, details) =>
  apiRequest(`/productos/${productId}`, { method: 'PUT', body: details })

export const deactivateProduct = (productId) =>
  apiRequest(`/productos/${productId}`, { method: 'DELETE' })

export const createCategory = (details) =>
  apiRequest('/categorias', { method: 'POST', body: details })

export const updateCategory = (categoryId, details) =>
  apiRequest(`/categorias/${categoryId}`, { method: 'PUT', body: details })
