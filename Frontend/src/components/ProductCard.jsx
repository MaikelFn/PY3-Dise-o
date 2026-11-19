import Icon from './Icon'

const formatPrice = (price) => new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
}).format(price)

function ProductCard({ product, quantity, isFavorite, onAdd, onFavorite }) {
  return (
    <article className="product-card">
      <div className={`product-media ${product.tone}`}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          aria-pressed={isFavorite}
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          onClick={() => onFavorite(product.id)}
          type="button"
        >
          <Icon name="heart" size={19} />
        </button>
        {!product.image && <span className="product-fallback" aria-hidden="true">{product.emoji}</span>}
        {product.image && (
          <img
            alt={product.name}
            className="product-photo"
            loading="lazy"
            onError={(event) => { event.currentTarget.hidden = true }}
            src={product.image}
          />
        )}
        {product.discount > 0 && <span className="discount-tag">-{product.discount}%</span>}
      </div>
      <div className="product-copy">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        {product.rating > 0 && (
          <div className="product-rating" aria-label={`Calificación ${product.rating} de 5`}>
            <span aria-hidden="true">★★★★★</span>
            <small>{product.rating} ({product.reviews})</small>
          </div>
        )}
        <div className="product-prices">
          <strong>{formatPrice(product.price)}</strong>
          {product.oldPrice > product.price && <del>{formatPrice(product.oldPrice)}</del>}
        </div>
        {product.shipping && <p className="product-shipping"><Icon name="truck" size={15} /> {product.shipping}</p>}
        <button
          className={`add-button${quantity ? ' has-item' : ''}`}
          onClick={() => onAdd(product)}
          type="button"
        >
          {quantity ? `En el carrito · ${quantity}` : 'Agregar al carrito'}
          <span><Icon name="plus" size={16} /></span>
        </button>
      </div>
    </article>
  )
}

export default ProductCard
