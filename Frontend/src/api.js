const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
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
      data?.mensaje || data?.message || `La solicitud falló (${response.status})`,
      response.status
    )
  }

  return data
}

export const getCategories = ({ signal } = {}) =>
  apiRequest('/categorias', { signal })

export function getProducts({ categoryId, search, signal } = {}) {
  const params = new URLSearchParams()
  if (categoryId) params.set('categoriaId', categoryId)
  if (search?.trim()) params.set('busqueda', search.trim())

  const query = params.toString()
  return apiRequest(`/productos${query ? `?${query}` : ''}`, { signal })
}

export async function getSession() {
  try {
    const data = await apiRequest('/auth/sesion')
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

export const getCart = () =>
  apiRequest('/carrito')

export const addCartItem = (productoId, cantidad = 1) =>
  apiRequest('/carrito/items', {
    method: 'POST',
    body: { productoId, cantidad }
  })

export const updateCartItem = (productoId, cantidad) =>
  apiRequest(`/carrito/items/${productoId}`, {
    method: 'PATCH',
    body: { cantidad }
  })

export const removeCartItem = (productoId) =>
  apiRequest(`/carrito/items/${productoId}`, { method: 'DELETE' })
