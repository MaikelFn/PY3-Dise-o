import { useEffect, useRef, useState } from 'react'
import { removeCartItem, updateCartItem } from '../api'

const formatPrice = (price) => new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
}).format(Number(price))

function CartDialog({ items, onItemsChanged, onClose }) {
  const dialogRef = useRef(null)
  const [error, setError] = useState('')
  const [busyProduct, setBusyProduct] = useState(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  async function changeQuantity(item, quantity) {
    setError('')
    setBusyProduct(item.ProductoID)
    try {
      const updatedItems = quantity < 1
        ? await removeCartItem(item.ProductoID)
        : await updateCartItem(item.ProductoID, quantity)
      onItemsChanged(updatedItems)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyProduct(null)
    }
  }

  const subtotal = items.reduce((total, item) => total + Number(item.Subtotal), 0)

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
          <h2 id="cart-dialog-title">Carrito ({items.length})</h2>
        </div>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Cerrar">×</button>
      </div>

      {error && <p className="dialog-error" role="alert">{error}</p>}
      {items.length === 0 ? (
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
          <p className="cart-disclaimer">El envío y el total se calculan al continuar con la compra.</p>
        </>
      )}
    </dialog>
  )
}

export default CartDialog
