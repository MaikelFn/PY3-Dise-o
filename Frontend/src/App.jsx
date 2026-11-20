import { useCallback, useEffect, useRef, useState } from 'react'
import clickMarketLogo from './assets/clickmarket-logo.png'
import {
  addCartItem,
  getCartItems,
  getCategories,
  resolveImageUrl,
  getProducts,
  getSession
} from './api'
import AuthDialog from './components/AuthDialog'
import CatalogPage from './components/CatalogPage'
import CartDialog from './components/CartDialog'
import AccessibilityWidget from './components/AccessibilityWidget'
import Icon from './components/Icon'
import ProductCard from './components/ProductCard'
import RoleDashboard from './components/RoleDashboard'
import { categories as categoryStyles } from './data/storeData'
import './App.css'

function normalizeText(value = '') {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function mapCategory(category) {
  const visual = categoryStyles.find((item) => normalizeText(item.name) === normalizeText(category.Nombre))
  return {
    id: category.CategoriaID,
    name: category.Nombre,
    description: category.Descripcion || '',
    emoji: visual?.emoji || '🛍️',
    tone: visual?.tone || 'category-blue'
  }
}

function mapProduct(product, categories) {
  const category = categories.find((item) => Number(item.id) === Number(product.CategoriaID))
  return {
    id: Number(product.ProductoID),
    categoryId: Number(product.CategoriaID),
    sellerId: Number(product.VendedorID),
    name: product.Nombre,
    category: category?.name || 'Sin categoría',
    description: product.Descripcion || '',
    image: resolveImageUrl(product.ImagenURL),
    price: Number(product.Precio),
    availableStock: Number(product.CantidadDisponible) || 0,
    emoji: category?.emoji || '📦',
    tone: (category?.tone || 'category-blue').replace('category-', 'tone-')
  }
}

function normalizeRole(role = '') {
  const normalized = normalizeText(role)
  if (normalized === 'comprador') return 'buyer'
  if (normalized === 'vendedor') return 'seller'
  if (normalized === 'administrador') return 'admin'
  return ''
}

function getRoute() {
  const url = new URL(window.location.href)
  if (url.pathname !== '/catalogo') return { page: 'home', query: '', category: 'Todas', favoritesOnly: false }

  return {
    page: 'catalog',
    query: url.searchParams.get('q') || '',
    category: url.searchParams.get('categoria') || 'Todas',
    favoritesOnly: url.searchParams.get('favoritos') === '1'
  }
}

function App() {
  const [search, setSearch] = useState('')
  const [route, setRoute] = useState(getRoute)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [user, setUser] = useState(null)
  const [dashboardVisible, setDashboardVisible] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [favorites, setFavorites] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [dialog, setDialog] = useState('')
  const [toast, setToast] = useState('')
  const [accessibilityTextSize, setAccessibilityTextSize] = useState('normal')
  const [accessibilityGrayscale, setAccessibilityGrayscale] = useState(false)
  const toastTimeout = useRef(null)
  const currentRole = normalizeRole(user?.rol)
  const cartCount = cartItems.reduce((total, item) => total + Number(item.Cantidad || 0), 0)
  const accessibilityWidget = (
    <AccessibilityWidget
      grayscale={accessibilityGrayscale}
      onChangeTextSize={setAccessibilityTextSize}
      onReset={() => { setAccessibilityTextSize('normal'); setAccessibilityGrayscale(false) }}
      onToggleGrayscale={() => setAccessibilityGrayscale((current) => !current)}
      textSize={accessibilityTextSize}
    />
  )

  const loadCatalog = useCallback(async () => {
    try {
      const [categoryRows, productRows] = await Promise.all([getCategories(), getProducts()])
      const nextCategories = categoryRows.map(mapCategory)
      setCategories(nextCategories)
      setProducts(productRows.map((product) => mapProduct(product, nextCategories)))
    } catch (error) {
      setCatalogError(error.message)
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimeout.current), [])

  useEffect(() => {
    const root = document.getElementById('root')
    document.documentElement.dataset.accessibilityTextSize = accessibilityTextSize
    root?.classList.toggle('accessibility-grayscale', accessibilityGrayscale)

    return () => {
      delete document.documentElement.dataset.accessibilityTextSize
      root?.classList.remove('accessibility-grayscale')
    }
  }, [accessibilityGrayscale, accessibilityTextSize])

  useEffect(() => {
    const request = window.setTimeout(() => { loadCatalog() }, 0)
    return () => window.clearTimeout(request)
  }, [loadCatalog])

  useEffect(() => {
    let active = true
    getSession()
      .then((session) => {
        if (active) {
          setUser(session)
          setCartLoading(Boolean(session))
          setSessionError('')
        }
      })
      .catch((error) => {
        if (active) setSessionError(error.message)
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) return undefined

    let active = true
    getCartItems()
      .then((items) => {
        if (active) {
          setCartItems(items)
          setCartError('')
        }
      })
      .catch((error) => {
        if (active) setCartError(error.message)
      })
      .finally(() => {
        if (active) setCartLoading(false)
      })

    return () => { active = false }
  }, [user])

  function refreshCatalog() {
    setCatalogLoading(true)
    setCatalogError('')
    return loadCatalog()
  }

  useEffect(() => {
    function handleHistoryNavigation() {
      const nextRoute = getRoute()
      setRoute(nextRoute)
      setSearch(nextRoute.query)
      window.scrollTo(0, 0)
    }

    window.addEventListener('popstate', handleHistoryNavigation)
    return () => window.removeEventListener('popstate', handleHistoryNavigation)
  }, [])

  function navigateToCatalog({ query = search, category = 'Todas', favoritesOnly = false } = {}) {
    const nextRoute = { page: 'catalog', query: query.trim(), category, favoritesOnly }
    const params = new URLSearchParams()
    if (nextRoute.query) params.set('q', nextRoute.query)
    if (category !== 'Todas') params.set('categoria', category)
    if (favoritesOnly) params.set('favoritos', '1')
    const queryString = params.toString()
    window.history.pushState(nextRoute, '', `/catalogo${queryString ? `?${queryString}` : ''}`)
    setRoute(nextRoute)
    setSearch(nextRoute.query)
    window.scrollTo(0, 0)
  }

  function navigateHome() {
    window.history.pushState({ page: 'home' }, '', '/')
    setRoute({ page: 'home', query: '', category: 'Todas', favoritesOnly: false })
    setSearch('')
    window.scrollTo(0, 0)
  }

  function notify(message) {
    setToast(message)
    window.clearTimeout(toastTimeout.current)
    toastTimeout.current = window.setTimeout(() => setToast(''), 2600)
  }

  async function addToCart(product) {
    if (!user) {
      notify('Inicia sesión para agregar productos al carrito.')
      setDialog('auth')
      return
    }

    try {
      setCartItems(await addCartItem(product.id))
      notify(`${product.name} se agregó a tu carrito`)
    } catch (error) {
      notify(error.message)
    }
  }

  function toggleFavorite(productId) {
    const alreadyFavorite = favorites.includes(productId)
    setFavorites((current) => alreadyFavorite
      ? current.filter((id) => id !== productId)
      : [...current, productId])
    notify(alreadyFavorite
      ? 'Producto quitado de favoritos.'
      : 'Favorito guardado solo durante esta sesión; la API actual no los persiste.')
  }

  function openCatalog(categoryName = 'Todas') {
    navigateToCatalog({ query: categoryName === 'Todas' ? search : '', category: categoryName })
  }

  function openCart() {
    if (!user) {
      notify('Inicia sesión para consultar tu carrito.')
      setDialog('auth')
      return
    }
    setDialog('cart')
  }

  function handleOrderCreated() {
    setCartItems([])
    setCartLoading(false)
    setCartError('')
  }

  function handleLogout() {
    setUser(null)
    setDashboardVisible(false)
    setCartItems([])
    setDialog('')
    navigateHome()
  }

  function handleAuthenticated(nextUser) {
    setUser(nextUser)
    setCartLoading(true)
    setCartError('')
    setSessionError('')
  }

  async function retryCart() {
    setCartLoading(true)
    setCartError('')
    try {
      setCartItems(await getCartItems())
    } catch (error) {
      setCartError(error.message)
    } finally {
      setCartLoading(false)
    }
  }

  if (user && currentRole && dashboardVisible) {
    return (
      <>
        <RoleDashboard
          key={`${user.id}-${currentRole}`}
          categories={categories}
          products={products}
          onCatalogChanged={refreshCatalog}
          onExit={() => { setDashboardVisible(false); navigateHome() }}
          onSwitchRole={() => setDialog('auth')}
          role={currentRole}
          user={user}
        />
        {dialog === 'auth' && (
          <AuthDialog user={user} onAuthenticated={handleAuthenticated} onClose={() => setDialog('')} onLoggedOut={handleLogout} onOpenDashboard={() => { setDashboardVisible(true); setDialog('') }} />
        )}
        {accessibilityWidget}
      </>
    )
  }

  return (
    <>
      {route.page === 'catalog' ? (
        <CatalogPage
          key={`${route.query}|${route.category}|${route.favoritesOnly}`}
          categories={categories}
          products={products}
          initialCategory={route.category}
          initialFavoritesOnly={route.favoritesOnly}
          initialSearch={route.query}
          favorites={favorites}
          cartItems={cartItems}
          user={user}
          loading={catalogLoading}
          error={catalogError}
          onRetry={refreshCatalog}
          onAddToCart={addToCart}
          onFavorite={toggleFavorite}
          onHome={navigateHome}
          onOpenAccount={() => setDialog('auth')}
          onOpenCart={openCart}
          onSearch={navigateToCatalog}
        />
      ) : (
    <div className="storefront">
      <div className="announcement-bar">
        <p><Icon name="truck" size={16} /> Envíos a todo Costa Rica <span className="announcement-divider">|</span> Compra fácil, recibe en casa</p>
        <a href="#ayuda">¿Necesitas ayuda?</a>
      </div>

      <header className="site-header">
        <div className="header-main">
          <a aria-label="ClickMarket, ir al inicio" className="brand-link" href="#inicio">
            <img alt="ClickMarket" src={clickMarketLogo} />
          </a>
          <form
            className="search-form"
            onSubmit={(event) => { event.preventDefault(); navigateToCatalog({ query: search, category: 'Todas' }) }}
            role="search"
          >
            <label className="visually-hidden" htmlFor="market-search">Buscar en ClickMarket</label>
            <Icon className="search-leading-icon" name="search" size={20} />
            <input
              autoComplete="off"
              id="market-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="¿Qué estás buscando hoy?"
              type="search"
              value={search}
            />
            <button aria-label="Buscar productos" type="submit"><Icon name="search" size={19} /><span>Buscar</span></button>
          </form>
          <div className="header-actions">
            <button className="header-link account-link" onClick={() => setDialog('auth')} type="button">
              <span className="header-icon"><Icon name="user" size={21} /></span>
              <span><small>{sessionLoading ? 'Conectando…' : user ? `Hola, ${user.nombre}` : 'Bienvenido'}</small><strong>{user ? 'Mi cuenta' : 'Iniciar sesión'}</strong></span>
            </button>
            <button aria-label={`Abrir carrito, ${cartCount} productos`} className="header-link cart-link" onClick={openCart} type="button">
              <span className="header-icon cart-header-icon"><Icon name="cart" size={22} /><i>{cartCount}</i></span>
              <span><small>Tu selección</small><strong>Carrito</strong></span>
            </button>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="main-nav">
          <button className="nav-all" onClick={() => openCatalog()} type="button"><Icon name="menu" size={18} /> Categorías</button>
          <button onClick={() => openCatalog()} type="button">Lo más buscado</button>
          <button onClick={() => openCatalog()} type="button">Catálogo</button>
          <button onClick={() => user ? openCatalog() : setDialog('auth')} type="button">Vende con nosotros</button>
          <button className="nav-favorites" onClick={() => navigateToCatalog({ query: '', favoritesOnly: true })} type="button">
            <Icon name="heart" size={16} /> Mis favoritos
          </button>
          <span className="nav-promise"><Icon name="shield" size={15} /> Compra con confianza</span>
        </nav>
      </header>

      <main>
        {(catalogError || sessionError || (user && !currentRole)) && (
          <div className="connection-banner" role="alert">
            {catalogError || sessionError || 'El rol de esta cuenta no es reconocido por la aplicación.'}
            {catalogError && <button onClick={loadCatalog} type="button">Reintentar</button>}
          </div>
        )}
        <section aria-labelledby="hero-title" className="hero-section" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><span className="eyebrow-dot" /> UN MUNDO DE BUENAS COMPRAS</span>
            <h1 id="hero-title">Lo que buscas,<br />está <em>a un clic.</em></h1>
            <p>Descubre productos para todos los días, encuentra tus favoritos y recíbelos donde estés.</p>
            <button className="button button-primary hero-button" onClick={() => openCatalog()} type="button">
              Explorar productos <Icon name="arrow" size={18} />
            </button>
            <div className="hero-trust"><Icon name="shield" size={17} /> Una experiencia de compra pensada para ti</div>
          </div>
          <div aria-label="Selección de productos para tu día a día" className="hero-visual" role="img">
            <div className="hero-visual-glow" />
            <div className="hero-photo">
              <img alt="" fetchPriority="high" src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=85" />
            </div>
            <div className="hero-floating-card hero-card-top"><span className="floating-icon">✦</span><span><strong>Encuentra algo especial</strong><small>Para cada momento</small></span></div>
            <div className="hero-floating-card hero-card-bottom"><span className="floating-round"><Icon name="truck" size={20} /></span><span><strong>Hasta tu puerta</strong><small>En todo Costa Rica</small></span></div>
            <span className="hero-spark hero-spark-one">✦</span><span className="hero-spark hero-spark-two">✳</span>
          </div>
          <div aria-hidden="true" className="hero-slide-dots"><i className="current" /><i /><i /></div>
        </section>

        <section aria-label="Beneficios de comprar en ClickMarket" className="benefit-strip">
          <article><span className="benefit-icon"><Icon name="truck" size={20} /></span><div><strong>Envíos nacionales</strong><small>Compra desde donde estés</small></div></article>
          <article><span className="benefit-icon"><Icon name="shield" size={20} /></span><div><strong>Compra con confianza</strong><small>Una experiencia segura</small></div></article>
          <article><span className="benefit-icon"><Icon name="support" size={20} /></span><div><strong>Atención cercana</strong><small>Estamos aquí para ayudarte</small></div></article>
          <article><span className="benefit-icon"><Icon name="sparkles" size={20} /></span><div><strong>Todo en un lugar</strong><small>Descubre algo nuevo</small></div></article>
        </section>

        <section aria-labelledby="categories-title" className="content-section categories-section" id="categorias">
          <div className="section-heading">
            <div><span className="eyebrow">UN MUNDO POR DESCUBRIR</span><h2 id="categories-title">¿Qué te gustaría encontrar?</h2></div>
            <button className="text-button" onClick={() => openCatalog()} type="button">Ver todas <Icon name="arrow" size={17} /></button>
          </div>
          <div className="category-grid">
            {categories.map((item) => (
              <button className={`category-card ${item.tone}`} key={item.id} onClick={() => openCatalog(item.name)} type="button">
                <span aria-hidden="true" className="category-art">{item.emoji}</span>
                <span className="category-name">{item.name}</span>
                <span aria-hidden="true" className="category-arrow"><Icon name="chevron" size={17} /></span>
              </button>
            ))}
          </div>
          {!catalogLoading && !catalogError && categories.length === 0 && <p className="empty-store-message">Aún no hay categorías disponibles.</p>}
        </section>

        <section aria-labelledby="offers-title" className="offer-section" id="ofertas">
          <div className="offer-copy">
            <span className="eyebrow offer-eyebrow"><Icon name="sparkles" size={15} /> DESCUBRE CLICKMARKET</span>
            <h2 id="offers-title">Pequeños hallazgos.<br />Grandes sonrisas.</h2>
            <p>Explora los productos que las tiendas han publicado para ti.</p>
            <button className="button button-dark" onClick={() => openCatalog()} type="button">Explorar el catálogo <Icon name="arrow" size={18} /></button>
          </div>
          <div aria-hidden="true" className="offer-art">
            <div className="offer-circle offer-circle-back" />
            <div className="offer-product offer-product-one"><span>🎧</span><small>TECNOLOGÍA</small></div>
            <div className="offer-product offer-product-two"><span>👜</span></div>
            <span className="offer-star offer-star-one">✦</span><span className="offer-star offer-star-two">✳</span>
            <div className="offer-sticker"><strong>Hallazgos</strong><span>que te encantarán</span></div>
          </div>
          <span className="offer-decoration offer-decoration-one" /><span className="offer-decoration offer-decoration-two" />
        </section>

        <section aria-labelledby="products-title" className="content-section products-section" id="productos">
          <div className="section-heading products-heading">
            <div><span className="eyebrow">SELECCIÓN CLICKMARKET</span><h2 id="products-title">Ideas para inspirarte</h2><p>Una pequeña muestra de lo que puedes descubrir.</p></div>
            <button className="text-button" onClick={() => openCatalog()} type="button">Ver todo el catálogo <Icon name="arrow" size={17} /></button>
          </div>
          <div className="product-grid home-featured-products">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                isFavorite={favorites.includes(product.id)}
                key={product.id}
                onAdd={addToCart}
                onFavorite={toggleFavorite}
                product={product}
                quantity={cartItems.find((item) => Number(item.ProductoID) === product.id)?.Cantidad || 0}
              />
            ))}
          </div>
          {!catalogLoading && !catalogError && products.length === 0 && <p className="empty-store-message">Todavía no hay productos publicados. Vuelve pronto para descubrir nuevas opciones.</p>}
          {catalogLoading && <p className="empty-store-message" role="status">Cargando catálogo…</p>}
        </section>

        <section aria-labelledby="seller-title" className="seller-section" id="vender">
          <div className="seller-icon"><Icon name="sparkles" size={28} /></div>
          <div className="seller-copy"><span className="eyebrow">CRECEMOS JUNTOS</span><h2 id="seller-title">¿Tienes un negocio?</h2><p>Inicia sesión con una cuenta de vendedor para administrar tu catálogo.</p></div>
          <button className="button button-outline seller-link" onClick={() => setDialog('auth')} type="button">Mi cuenta <Icon name="arrow" size={18} /></button>
          <span aria-hidden="true" className="seller-decoration">✦</span>
        </section>
      </main>

      <footer className="site-footer" id="ayuda">
        <div className="footer-main">
          <div className="footer-brand-column">
            <a aria-label="ClickMarket, ir al inicio" className="footer-brand" href="#inicio"><img alt="ClickMarket" src={clickMarketLogo} /></a>
            <p>Un mercado para descubrir, elegir y disfrutar.</p>
            <div className="social-links" aria-label="Redes sociales"><a aria-label="Facebook" href="#ayuda">f</a><a aria-label="Instagram" href="#ayuda">◎</a><a aria-label="TikTok" href="#ayuda">♪</a></div>
          </div>
          <div className="footer-column"><strong>Explora</strong><a href="#categorias">Categorías</a><a href="#productos">Productos</a><a href="/catalogo">Catálogo</a></div>
          <div className="footer-column"><strong>ClickMarket</strong><a href="#vender">Vende con nosotros</a><a href="#ayuda">Sobre nosotros</a><a href="#ayuda">Centro de ayuda</a></div>
          <div className="newsletter">
            <strong>Buenas noticias, de vez en cuando</strong>
            <p>Ideas y novedades para disfrutar más tus compras.</p>
            <small>Las suscripciones estarán disponibles cuando la API incluya ese servicio.</small>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 ClickMarket. Hecho para comprar mejor.</span><span>Una experiencia de compra local y cercana</span></div>
      </footer>
    </div>
      )}
      {dialog === 'auth' && (
        <AuthDialog user={user} onAuthenticated={handleAuthenticated} onClose={() => setDialog('')} onLoggedOut={handleLogout} onOpenDashboard={() => { setDashboardVisible(true); setDialog('') }} />
      )}
      {dialog === 'cart' && (
        <CartDialog
          canCheckout={currentRole === 'buyer'}
          error={cartError}
          items={cartItems}
          loading={cartLoading}
          onOrderCreated={handleOrderCreated}
          onRetry={retryCart}
          onItemsChanged={setCartItems}
          onClose={() => setDialog('')}
        />
      )}
      <div aria-atomic="true" aria-live="polite" className={`toast${toast ? ' visible' : ''}`} role="status">{toast}</div>
      {accessibilityWidget}
    </>
  )
}

export default App
