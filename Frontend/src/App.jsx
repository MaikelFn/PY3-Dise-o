import { useEffect, useState } from 'react'
import {
  addCartItem,
  getCart,
  getCategories,
  getProducts,
  getSession
} from './api'
import clickMarketLogo from './assets/clickmarket-logo.png'
import AuthDialog from './components/AuthDialog'
import CartDialog from './components/CartDialog'
import './App.css'

const categoryIcons = {
  Electrónica: '📱',
  Computación: '💻',
  Hogar: '🏠',
  Ropa: '👕',
  Moda: '👕',
  Deportes: '⚽',
  Libros: '📚'
}

const formatPrice = (price) => new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
}).format(Number(price))

function App() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [categoryError, setCategoryError] = useState('')
  const [productError, setProductError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [sessionUser, setSessionUser] = useState(null)
  const [sessionError, setSessionError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [cartError, setCartError] = useState('')
  const [pendingProductId, setPendingProductId] = useState(null)
  const cartCount = cartItems.reduce((total, item) => total + Number(item.Cantidad), 0)

  useEffect(() => {
    const controller = new AbortController()
    getCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((error) => {
        if (error.name !== 'AbortError') setCategoryError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCategories(false)
      })
    return () => controller.abort()
  }, [retryToken])

  useEffect(() => {
    const controller = new AbortController()
    getProducts({ categoryId: categoryFilter, search, signal: controller.signal })
      .then(setProducts)
      .catch((error) => {
        if (error.name !== 'AbortError') setProductError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProducts(false)
      })
    return () => controller.abort()
  }, [categoryFilter, retryToken, search])

  useEffect(() => {
    let active = true
    getSession()
      .then(async (user) => {
        if (!active) return
        setSessionUser(user)
        if (user) {
          try {
            setCartItems(await getCart())
          } catch (error) {
            if (active) setCartError(error.message)
          }
        }
      })
      .catch((error) => {
        if (active) setSessionError(error.message)
      })
    return () => { active = false }
  }, [])

  function showCatalog() {
    if (categoryFilter) changeCategoryFilter('')
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  function changeCategoryFilter(value) {
    setLoadingProducts(true)
    setProductError('')
    setCategoryFilter(value)
  }

  function changeSearch(value) {
    setLoadingProducts(true)
    setProductError('')
    setSearch(value)
  }

  function retryApi() {
    setLoadingCategories(true)
    setLoadingProducts(true)
    setCategoryError('')
    setProductError('')
    setRetryToken((token) => token + 1)
  }

  async function handleAddToCart(productId) {
    setCartError('')
    if (!sessionUser) {
      setPendingProductId(productId)
      setAuthOpen(true)
      return
    }

    try {
      setCartItems(await addCartItem(productId))
    } catch (error) {
      if (error.status === 401) {
        setSessionUser(null)
        setPendingProductId(productId)
        setAuthOpen(true)
      } else {
        setCartError(error.message)
      }
    }
  }

  async function handleAuthenticated(user) {
    setSessionUser(user)
    setSessionError('')
    setCartError('')
    try {
      let updatedItems = await getCart()
      if (pendingProductId) updatedItems = await addCartItem(pendingProductId)
      setCartItems(updatedItems)
    } catch (error) {
      setCartError(error.message)
    } finally {
      setPendingProductId(null)
    }
  }

  function handleLoggedOut() {
    setSessionUser(null)
    setCartItems([])
    setCartError('')
  }

  const selectedCategory = categories.find(
    (category) => String(category.CategoriaID) === categoryFilter
  )?.Nombre

  return (
    <div className="storefront">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>📍 Envíos a todo Costa Rica</span>
          <div className="utility-links">
            <a href="#ayuda">Centro de ayuda</a>
            <a href="#vender">Vende en ClickMarket</a>
          </div>
        </div>
      </div>

      <header className="store-header">
        <div className="header-main">
          <a className="brand-link" href="#inicio" aria-label="ClickMarket, ir al inicio">
            <img src={clickMarketLogo} alt="ClickMarket" />
          </a>

          <form
            className="search-form"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              showCatalog()
            }}
          >
            <label className="visually-hidden" htmlFor="market-search">Buscar productos</label>
            <input
              id="market-search"
              type="search"
              placeholder="¿Qué estás buscando hoy?"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
            />
            <button type="submit" aria-label="Buscar productos">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.2 4.2" />
              </svg>
              <span>Buscar</span>
            </button>
          </form>

          <div className="header-actions">
            <button className="header-action account-action" type="button" onClick={() => setAuthOpen(true)}>
              <span className="action-icon" aria-hidden="true">♙</span>
              <span>
                <small>{sessionUser ? `Hola, ${sessionUser.nombre}` : 'Hola, bienvenido'}</small>
                <strong>{sessionUser ? 'Mi cuenta' : 'Iniciar sesión'}</strong>
              </span>
            </button>
            <button
              className="header-action cart-action"
              type="button"
              aria-label={`Carrito, ${cartCount} productos`}
              onClick={() => sessionUser ? setCartOpen(true) : setAuthOpen(true)}
            >
              <span className="action-icon cart-icon" aria-hidden="true">🛒</span>
              <span><small>Tu compra</small><strong>Carrito <i>{cartCount}</i></strong></span>
            </button>
          </div>
        </div>

        <nav className="category-nav" aria-label="Categorías y secciones">
          <a className="all-categories" href="#categorias"><span aria-hidden="true">☰</span> Todas las categorías</a>
          <a href="#productos">Lo más vendido</a>
          <a href="#ofertas">Ofertas</a>
          <a href="#vender">Vende con nosotros</a>
          <span className="nav-promise">Compra fácil. Compra seguro.</span>
        </nav>
      </header>

      <main>
        <section className="hero-banner" id="inicio">
          <div className="hero-content">
            <span className="hero-kicker"><span /> LO NUEVO EN CLICKMARKET</span>
            <h1>Encuentra eso que<br />te hace falta.</h1>
            <p>Un mundo de productos para tu día a día, con buenas ofertas y entrega hasta tu puerta.</p>
            <button className="hero-cta" type="button" onClick={showCatalog}>
              Explorar productos <span aria-hidden="true">→</span>
            </button>
            <div className="hero-note"><span aria-hidden="true">✓</span> Compra protegida en cada pedido</div>
          </div>

          <div className="hero-art" aria-label="Selección de productos destacados">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-product hero-product-main">
              <span className="hero-product-label">TECNOLOGÍA PARA TI</span>
              <span className="hero-phone" aria-hidden="true">📱</span>
              <span className="hero-product-caption">Descubre lo nuevo</span>
            </div>
            <div className="hero-product hero-product-small">
              <span aria-hidden="true">🎧</span>
            </div>
            <div className="hero-sticker"><strong>¡Hola!</strong><span>Buenas compras<br />empiezan aquí</span></div>
          </div>

          <div className="hero-pagination" aria-hidden="true"><i className="active" /><i /><i /></div>
        </section>

        <section className="benefit-row" aria-label="Beneficios">
          <article><span aria-hidden="true">🚚</span><div><strong>Envíos nacionales</strong><small>Recibe donde estés</small></div></article>
          <article><span aria-hidden="true">🔒</span><div><strong>Compra segura</strong><small>Tus datos protegidos</small></div></article>
          <article><span aria-hidden="true">💬</span><div><strong>Estamos para ayudarte</strong><small>Atención cercana</small></div></article>
          <article><span aria-hidden="true">✨</span><div><strong>Todo en un solo lugar</strong><small>Compra fácil y rápido</small></div></article>
        </section>

        <section className="category-section" id="categorias">
          <div className="section-title">
            <div><span className="section-eyebrow">EXPLORA LA TIENDA</span><h2>Compra por categoría</h2></div>
            <button className="text-link" type="button" onClick={() => changeCategoryFilter('')}>Ver todo <span aria-hidden="true">→</span></button>
          </div>
          <div className="category-list">
            {loadingCategories && <p className="inline-status">Cargando categorías…</p>}
            {categoryError && <p className="inline-error" role="alert">{categoryError}</p>}
            {!loadingCategories && !categoryError && categories.map((category) => (
              <button
                className={`category-tile${categoryFilter === String(category.CategoriaID) ? ' selected' : ''}`}
                key={category.CategoriaID}
                type="button"
                onClick={() => {
                  changeCategoryFilter(categoryFilter === String(category.CategoriaID) ? '' : String(category.CategoriaID))
                  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
                }}
                aria-pressed={categoryFilter === String(category.CategoriaID)}
              >
                <span className="category-emoji" aria-hidden="true">{categoryIcons[category.Nombre] || '🛍️'}</span>
                <span>{category.Nombre}</span>
                <span className="tile-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="deals-section" id="ofertas">
          <div className="section-title">
            <div><span className="section-eyebrow">SELECCIÓN DE LA SEMANA</span><h2>Algo bueno te espera</h2></div>
            <span className="deal-note"><span aria-hidden="true">✦</span> Nuevos favoritos, cada semana</span>
          </div>
          <div className="deal-banner">
            <div>
              <span className="deal-label">OFERTAS PARA DESCUBRIR</span>
              <h3>Pequeños hallazgos.<br />Grandes sonrisas.</h3>
              <p>Explora productos elegidos para hacer más fácil tu día.</p>
              <button type="button" onClick={showCatalog}>Descubrir ofertas <span aria-hidden="true">→</span></button>
            </div>
            <div className="deal-visual" aria-hidden="true">
              <span className="deal-shape shape-back">🎁</span>
              <span className="deal-shape shape-front">🛍️</span>
              <span className="deal-spark spark-a">✦</span>
              <span className="deal-spark spark-b">✳</span>
            </div>
          </div>
        </section>

        <section className="products-section" id="productos">
          <div className="section-title product-title">
            <div>
              <span className="section-eyebrow">PARA EMPEZAR A EXPLORAR</span>
              <h2>{selectedCategory || (search ? 'Resultados de búsqueda' : 'Productos de la tienda')}</h2>
            </div>
            <div className="product-controls">
              <label className="visually-hidden" htmlFor="product-category">Filtrar por categoría</label>
              <select id="product-category" value={categoryFilter} onChange={(event) => changeCategoryFilter(event.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map((category) => <option key={category.CategoriaID} value={category.CategoriaID}>{category.Nombre}</option>)}
              </select>
            </div>
          </div>

          {sessionError && <p className="inline-error" role="alert">{sessionError}</p>}
          {cartError && <p className="inline-error" role="alert">{cartError}</p>}
          {productError && (
            <div className="empty-results" role="alert">
              <h3>No pudimos cargar los productos</h3>
              <p>{productError}</p>
              <button type="button" onClick={retryApi}>Reintentar</button>
            </div>
          )}
          {loadingProducts && !productError ? (
            <div className="empty-results" role="status"><p>Cargando productos…</p></div>
          ) : !productError && products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.ProductoID}>
                  <div className="product-image">
                    <span className="product-label">{Number(product.CantidadDisponible) > 0 ? 'Disponible' : 'Agotado'}</span>
                    {product.ImagenPrincipal
                      ? <img className="product-photo" src={product.ImagenPrincipal} alt="" loading="lazy" />
                      : <span className="product-emoji" aria-hidden="true">{categoryIcons[product.Categoria] || '🛍️'}</span>}
                  </div>
                  <div className="product-info">
                    <span className="product-category">{product.Categoria} · {product.Vendedor}</span>
                    <h3>{product.Nombre}</h3>
                    <div className="price-line">
                      <strong>{formatPrice(product.Precio)}</strong>
                    </div>
                    <button
                      className="add-button"
                      type="button"
                      onClick={() => handleAddToCart(product.ProductoID)}
                      disabled={Number(product.CantidadDisponible) < 1}
                    >
                      {Number(product.CantidadDisponible) < 1 ? 'Sin existencias' : 'Agregar al carrito'}
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : !productError && (
            <div className="empty-results">
              <span aria-hidden="true">🔎</span>
              <h3>No encontramos productos</h3>
              <p>Prueba con otra búsqueda o explora todas las categorías.</p>
              <button type="button" onClick={() => { changeSearch(''); changeCategoryFilter('') }}>Ver todos los productos</button>
            </div>
          )}
        </section>

        <section className="seller-banner" id="vender">
          <div className="seller-icon" aria-hidden="true">✦</div>
          <div><span className="section-eyebrow">¿TIENES UN NEGOCIO?</span><h2>Haz crecer tu tienda con ClickMarket</h2><p>Llega a más personas y muestra tus productos en un solo lugar.</p></div>
          <a href="#ayuda">Conoce cómo vender <span aria-hidden="true">→</span></a>
        </section>
      </main>

      <footer className="store-footer" id="ayuda">
        <a className="footer-brand" href="#inicio"><img src={clickMarketLogo} alt="ClickMarket" /></a>
        <p>Un mercado para descubrir, elegir y disfrutar.</p>
        <span>© 2026 ClickMarket · Hecho para comprar mejor</span>
      </footer>
      {authOpen && (
        <AuthDialog
          user={sessionUser}
          onAuthenticated={handleAuthenticated}
          onLoggedOut={handleLoggedOut}
          onClose={() => setAuthOpen(false)}
        />
      )}
      {cartOpen && sessionUser && (
        <CartDialog
          items={cartItems}
          onItemsChanged={setCartItems}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  )
}

export default App
