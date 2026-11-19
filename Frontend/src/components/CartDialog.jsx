import { useEffect, useRef, useState } from 'react'
import {
  createAddress,
  createOrder,
  getAddresses,
  getShippingTypes,
  removeCartItem,
  updateCartItem
} from '../api'

const formatPrice = (price) => new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
}).format(Number(price))

function CartDialog({
  items,
  loading,
  error: loadError,
  canCheckout,
  onItemsChanged,
  onOrderCreated,
  onRetry,
  onClose
}) {
  const dialogRef = useRef(null)
  const [requestError, setRequestError] = useState('')
  const [busyProduct, setBusyProduct] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [addresses, setAddresses] = useState([])
  const [shippingTypes, setShippingTypes] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [selectedShippingTypeId, setSelectedShippingTypeId] = useState('')
  const [addingAddress, setAddingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    provincia: '',
    canton: '',
    distrito: '',
    detalle: ''
  })
  const [orderCreated, setOrderCreated] = useState(null)
  const itemCount = items.reduce((total, item) => total + Number(item.Cantidad || 0), 0)
  const subtotal = items.reduce((total, item) => total + Number(item.Subtotal || 0), 0)
  const selectedShipping = shippingTypes.find(
    (type) => Number(type.TipoEnvioID) === Number(selectedShippingTypeId)
  )
  const shippingCost = Number(selectedShipping?.Costo || 0)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  async function changeQuantity(item, quantity) {
    setRequestError('')
    setBusyProduct(item.ProductoID)
    try {
      const updatedItems = quantity < 1
        ? await removeCartItem(item.ProductoID)
        : await updateCartItem(item.ProductoID, quantity)
      onItemsChanged(updatedItems)
    } catch (requestError) {
      setRequestError(requestError.message)
    } finally {
      setBusyProduct(null)
    }
  }

  async function startCheckout() {
    setCheckoutOpen(true)
    setCheckoutLoading(true)
    setCheckoutError('')
    setOrderCreated(null)
    try {
      const [nextAddresses, nextShippingTypes] = await Promise.all([
        getAddresses(),
        getShippingTypes()
      ])
      setAddresses(nextAddresses)
      setShippingTypes(nextShippingTypes)
      setSelectedAddressId((current) => {
        const existing = nextAddresses.find(
          (address) => String(address.DireccionID) === current
        )
        return String(
          existing?.DireccionID ||
          nextAddresses.find((address) => address.Principal)?.DireccionID ||
          nextAddresses[0]?.DireccionID ||
          ''
        )
      })
      setSelectedShippingTypeId((current) => {
        const existing = nextShippingTypes.find(
          (type) => String(type.TipoEnvioID) === current
        )
        return String(existing?.TipoEnvioID || nextShippingTypes[0]?.TipoEnvioID || '')
      })
      setAddingAddress(nextAddresses.length === 0)
    } catch (error) {
      setCheckoutError(error.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function saveAddress(event) {
    event.preventDefault()
    setCheckoutError('')
    setCheckoutBusy(true)
    try {
      const response = await createAddress({
        ...newAddress,
        principal: addresses.length === 0
      })
      const address = response.direccion
      setAddresses((current) => [address, ...current])
      setSelectedAddressId(String(address.DireccionID))
      setNewAddress({ provincia: '', canton: '', distrito: '', detalle: '' })
      setAddingAddress(false)
    } catch (error) {
      setCheckoutError(error.message)
    } finally {
      setCheckoutBusy(false)
    }
  }

  async function placeOrder() {
    if (!selectedAddressId || !selectedShippingTypeId) {
      setCheckoutError('Selecciona una dirección y un tipo de envío.')
      return
    }

    setCheckoutError('')
    setCheckoutBusy(true)
    try {
      const response = await createOrder({
        direccionID: Number(selectedAddressId),
        tipoEnvioID: Number(selectedShippingTypeId)
      })
      setOrderCreated(response.pedidoID)
      onOrderCreated()
    } catch (error) {
      setCheckoutError(error.message)
    } finally {
      setCheckoutBusy(false)
    }
  }

  return (
    <dialog
      className="app-dialog cart-dialog"
      ref={dialogRef}
      aria-labelledby="cart-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="section-eyebrow">TU COMPRA</span>
          <h2 id="cart-dialog-title">Carrito ({itemCount})</h2>
        </div>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Cerrar">×</button>
      </div>

      {(loadError || requestError || checkoutError) && (
        <div className="dialog-error" role="alert">
          <p>{checkoutError || requestError || loadError}</p>
          {loadError && <button className="dashboard-secondary-button" onClick={onRetry} type="button">Reintentar</button>}
        </div>
      )}
      {orderCreated ? (
        <div className="checkout-success" role="status">
          <span aria-hidden="true">✓</span>
          <h3>Pedido #{orderCreated} registrado</h3>
          <p>Quedó pendiente de pago y las existencias fueron reservadas. No se realizó ningún cobro.</p>
          <button className="dialog-primary" onClick={onClose} type="button">Continuar</button>
        </div>
      ) : loading ? (
        <div className="empty-cart" role="status"><h3>Cargando tu carrito…</h3></div>
      ) : items.length === 0 ? (
        <div className="empty-cart">
          <span aria-hidden="true">🛒</span>
          <h3>Tu carrito está vacío</h3>
          <p>Explora la tienda y agrega algo que te guste.</p>
        </div>
      ) : (
        <>
          <ul className="cart-items">
            {items.map((item) => (
              <li className="cart-item" key={item.ProductoID}>
                <div className="cart-item-copy">
                  <strong>{item.Producto}</strong>
                  <span>{formatPrice(item.Precio)} · Subtotal {formatPrice(item.Subtotal)}</span>
                  <div className="quantity-control" aria-label={`Cantidad de ${item.Producto}`}>
                    <button type="button" onClick={() => changeQuantity(item, item.Cantidad - 1)} disabled={busyProduct === item.ProductoID}>−</button>
                    <span>{item.Cantidad}</span>
                    <button type="button" onClick={() => changeQuantity(item, item.Cantidad + 1)} disabled={busyProduct === item.ProductoID || item.Cantidad >= item.CantidadDisponible}>+</button>
                  </div>
                </div>
                <button className="remove-item" type="button" onClick={() => changeQuantity(item, 0)} disabled={busyProduct === item.ProductoID}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-total"><span>Subtotal estimado</span><strong>{formatPrice(subtotal)}</strong></div>
          <p className="cart-disclaimer">El envío se calcula al elegir la dirección y el tipo de entrega.</p>
          {canCheckout ? (
            <button className="dialog-primary checkout-start-button" disabled={checkoutLoading} onClick={startCheckout} type="button">
              {checkoutLoading ? 'Cargando opciones…' : checkoutOpen ? 'Actualizar datos de entrega' : 'Continuar con la compra'}
            </button>
          ) : (
            <p className="cart-disclaimer">El checkout está disponible para cuentas de comprador.</p>
          )}
          {checkoutOpen && (
            <section aria-label="Datos de entrega" className="checkout-section">
              <h3>Entrega del pedido</h3>
              {checkoutLoading ? (
                <p role="status">Cargando direcciones y opciones de envío…</p>
              ) : (
                <>
                  {addresses.length > 0 && !addingAddress && (
                    <>
                      <label className="checkout-field">Dirección
                        <select onChange={(event) => setSelectedAddressId(event.target.value)} required value={selectedAddressId}>
                          <option value="">Selecciona una dirección</option>
                          {addresses.map((address) => (
                            <option key={address.DireccionID} value={address.DireccionID}>
                              {address.Detalle}, {address.Distrito}, {address.Canton}, {address.Provincia}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="checkout-link-button" onClick={() => setAddingAddress(true)} type="button">Agregar otra dirección</button>
                    </>
                  )}
                  {addingAddress && (
                    <form className="checkout-address-form" onSubmit={saveAddress}>
                      <h4>{addresses.length ? 'Nueva dirección' : 'Agrega una dirección para continuar'}</h4>
                      <label>Provincia<input autoComplete="address-level1" maxLength="100" onChange={(event) => setNewAddress({ ...newAddress, provincia: event.target.value })} required value={newAddress.provincia} /></label>
                      <label>Cantón<input autoComplete="address-level2" maxLength="100" onChange={(event) => setNewAddress({ ...newAddress, canton: event.target.value })} required value={newAddress.canton} /></label>
                      <label>Distrito<input maxLength="100" onChange={(event) => setNewAddress({ ...newAddress, distrito: event.target.value })} required value={newAddress.distrito} /></label>
                      <label>Señas<input autoComplete="street-address" maxLength="300" onChange={(event) => setNewAddress({ ...newAddress, detalle: event.target.value })} required value={newAddress.detalle} /></label>
                      <div className="checkout-form-actions">
                        <button className="dashboard-primary-button" disabled={checkoutBusy} type="submit">{checkoutBusy ? 'Guardando…' : 'Guardar dirección'}</button>
                        {addresses.length > 0 && <button className="dashboard-secondary-button" onClick={() => setAddingAddress(false)} type="button">Cancelar</button>}
                      </div>
                    </form>
                  )}
                  <label className="checkout-field">Tipo de envío
                    <select onChange={(event) => setSelectedShippingTypeId(event.target.value)} required value={selectedShippingTypeId}>
                      <option value="">Selecciona un tipo de envío</option>
                      {shippingTypes.map((type) => (
                        <option key={type.TipoEnvioID} value={type.TipoEnvioID}>
                          {type.Nombre} · {formatPrice(type.Costo)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {shippingTypes.length === 0 && <p className="cart-disclaimer" role="alert">No hay tipos de envío disponibles. Inténtalo más tarde.</p>}
                  <div className="checkout-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <div className="checkout-total"><span>Envío</span><strong>{formatPrice(shippingCost)}</strong></div>
                  <div className="checkout-total checkout-grand-total"><span>Total estimado</span><strong>{formatPrice(subtotal + shippingCost)}</strong></div>
                  <button
                    className="dialog-primary"
                    disabled={checkoutBusy || !selectedAddressId || !selectedShippingTypeId || addingAddress}
                    onClick={placeOrder}
                    type="button"
                  >
                    {checkoutBusy ? 'Registrando…' : 'Registrar pedido pendiente'}
                  </button>
                  <p className="cart-disclaimer">Este flujo reserva inventario y registra el pedido; no procesa un pago real.</p>
                </>
              )}
            </section>
          )}
        </>
      )}
    </dialog>
  )
}

export default CartDialog
