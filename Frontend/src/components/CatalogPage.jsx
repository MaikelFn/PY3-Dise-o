import { useMemo, useState } from 'react'
import clickMarketLogo from '../assets/clickmarket-logo.png'
import Icon from './Icon'
import ProductCard from './ProductCard'
import './CatalogPage.css'

const normalizeText = (value) => value
  .toLocaleLowerCase('es')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

function CatalogPage({
  initialSearch = '',
  initialCategory = 'Todas',
  initialFavoritesOnly = false,
  categories,
  products,
  favorites,
  cartItems,
  user,
  loading,
  error,
  onRetry,
  onHome,
  onSearch,
  onAddToCart,
  onFavorite,
  onOpenAccount,
  onOpenCart
}) {
  const [search, setSearch] = useState(initialSearch)
  const [appliedSearch, setAppliedSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState('featured')
  const [minimumPrice, setMinimumPrice] = useState('')
  const [maximumPrice, setMaximumPrice] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    const query = normalizeText(appliedSearch.trim())
    const matches = products.filter((product) => {
      const searchableText = normalizeText(`${product.name} ${product.category} ${product.description}`)
      const matchesQuery = !query || searchableText.includes(query)
      const matchesCategory = category === 'Todas' || product.category === category
      const matchesMinimumPrice = !minimumPrice || product.price >= Number(minimumPrice)
      const matchesMaximumPrice = !maximumPrice || product.price <= Number(maximumPrice)
      const matchesFavorite = !favoritesOnly || favorites.includes(product.id)
      return matchesQuery && matchesCategory && matchesMinimumPrice && matchesMaximumPrice &&
        matchesFavorite
    })

    if (sortBy === 'price-asc') return matches.sort((first, second) => first.price - second.price)
    if (sortBy === 'price-desc') return matches.sort((first, second) => second.price - first.price)
    if (sortBy === 'rating') return matches.sort((first, second) => second.rating - first.rating)
    return matches
  }, [appliedSearch, category, favorites, favoritesOnly, maximumPrice, minimumPrice, sortBy, products])

  const cartCount = cartItems.reduce((total, item) => total + Number(item.Cantidad || 0), 0)
  const hasActiveFilters = Boolean(
    appliedSearch || category !== 'Todas' || minimumPrice || maximumPrice ||
    favoritesOnly
  )

  function applySearch(event) {
    event.preventDefault()
    const normalizedSearch = search.trim()
    setAppliedSearch(normalizedSearch)
    onSearch({ query: normalizedSearch, category, favoritesOnly })
  }

  function selectCategory(name) {
    setCategory(name)
    setFavoritesOnly(false)
    setMobileFiltersOpen(false)
  }

  function clearFilters() {
    setSearch('')
    setAppliedSearch('')
    setCategory('Todas')
    setMinimumPrice('')
    setMaximumPrice('')
    setFavoritesOnly(false)
    onSearch({ query: '', category: 'Todas', favoritesOnly: false })
  }

  return (
    <div className="storefront catalog-view">
      <div className="announcement-bar">
        <p><Icon name="truck" size={16} /> Envíos a todo Costa Rica <span className="announcement-divider">|</span> Compra fácil, recibe en casa</p>
        <button onClick={onHome} type="button">Volver al inicio</button>
      </div>

      <header className="site-header">
        <div className="header-main">
          <a aria-label="ClickMarket, volver al inicio" className="brand-link" href="/" onClick={(event) => { event.preventDefault(); onHome() }}>
            <img alt="ClickMarket" src={clickMarketLogo} />
          </a>
          <form className="search-form" onSubmit={applySearch} role="search">
            <label className="visually-hidden" htmlFor="catalog-search">Buscar productos</label>
            <Icon className="search-leading-icon" name="search" size={20} />
            <input
              autoComplete="off"
              id="catalog-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, categoría o descripción"
              type="search"
              value={search}
            />
            <button aria-label="Buscar productos" type="submit"><Icon name="search" size={19} /><span>Buscar</span></button>
          </form>
          <div className="header-actions">
            <button className="header-link account-link" onClick={onOpenAccount} type="button">
              <span className="header-icon"><Icon name="user" size={21} /></span>
              <span><small>{user ? `Hola, ${user.nombre}` : 'Bienvenido'}</small><strong>{user ? 'Mi cuenta' : 'Iniciar sesión'}</strong></span>
            </button>
            <button aria-label={`Abrir carrito, ${cartCount} productos`} className="header-link cart-link" onClick={onOpenCart} type="button">
              <span className="header-icon cart-header-icon"><Icon name="cart" size={22} /><i>{cartCount}</i></span>
              <span><small>Tu selección</small><strong>Carrito</strong></span>
            </button>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="main-nav catalog-nav">
          <button className="nav-all" onClick={() => document.getElementById('catalog-filters')?.scrollIntoView({ behavior: 'smooth' })} type="button"><Icon name="menu" size={18} /> Categorías y filtros</button>
          <button onClick={() => setSortBy('price-asc')} type="button">Mejores precios</button>
          <button onClick={() => { setFavoritesOnly(true); setMobileFiltersOpen(false) }} type="button"><Icon name="heart" size={15} /> Mis favoritos</button>
          <span className="nav-promise"><Icon name="shield" size={15} /> Compra con confianza</span>
        </nav>
      </header>

      <main className="catalog-main">
        <nav aria-label="Ruta de navegación" className="catalog-breadcrumb">
          <button onClick={onHome} type="button">Inicio</button><Icon name="chevron" size={14} /><span>Productos</span>
          {category !== 'Todas' && <><Icon name="chevron" size={14} /><strong>{category}</strong></>}
        </nav>

        <div className="catalog-heading">
          <div>
            <span className="eyebrow">ENCUENTRA ALGO PARA TI</span>
            <h1>{appliedSearch ? `Resultados para “${appliedSearch}”` : category !== 'Todas' ? category : favoritesOnly ? 'Tus productos favoritos' : 'Explora todos los productos'}</h1>
            <p>Descubre, compara y encuentra tus nuevos favoritos.</p>
          </div>
          <span className="catalog-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}</span>
        </div>

        <div className="catalog-layout">
          <button
            aria-expanded={mobileFiltersOpen}
            className="mobile-filter-toggle"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            type="button"
          >
            <Icon name="settings" size={17} /> {mobileFiltersOpen ? 'Ocultar filtros' : 'Filtros y categorías'} <Icon name="chevron" size={16} />
          </button>

          <aside aria-label="Filtros de productos" className={`catalog-sidebar${mobileFiltersOpen ? ' filters-open' : ''}`} id="catalog-filters">
            <div className="filter-heading"><h2>Filtrar por</h2><button onClick={clearFilters} type="button">Limpiar</button></div>
            <section className="filter-group">
              <h3>Categorías</h3>
              <div className="catalog-category-options">
                <button aria-pressed={category === 'Todas'} className={category === 'Todas' ? 'selected' : ''} onClick={() => selectCategory('Todas')} type="button"><span>Todas las categorías</span><i>{products.length}</i></button>
                {categories.map((item) => {
                  const count = products.filter((product) => product.category === item.name).length
                  return (
                    <button aria-pressed={category === item.name} className={category === item.name ? 'selected' : ''} key={item.name} onClick={() => selectCategory(item.name)} type="button">
                      <span>{item.emoji} {item.name}</span><i>{count}</i>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="filter-group">
              <h3>Rango de precio</h3>
              <div className="price-inputs">
                <label><span>Mínimo</span><div><b>₡</b><input inputMode="numeric" min="0" onChange={(event) => setMinimumPrice(event.target.value)} placeholder="0" type="number" value={minimumPrice} /></div></label>
                <span className="price-separator">—</span>
                <label><span>Máximo</span><div><b>₡</b><input inputMode="numeric" min="0" onChange={(event) => setMaximumPrice(event.target.value)} placeholder="50 000" type="number" value={maximumPrice} /></div></label>
              </div>
              <button className="price-apply-button" onClick={() => setMobileFiltersOpen(false)} type="button">Aplicar precio</button>
            </section>

          </aside>

          <section aria-label="Resultados del catálogo" className="catalog-results">
            <div className="catalog-toolbar">
              <div className="active-filter-chips">
                {category !== 'Todas' && <button onClick={() => selectCategory('Todas')} type="button">{category} <Icon name="close" size={13} /></button>}
                {appliedSearch && <button onClick={() => { setSearch(''); setAppliedSearch(''); onSearch({ query: '', category, favoritesOnly }) }} type="button">“{appliedSearch}” <Icon name="close" size={13} /></button>}
                {favoritesOnly && <span><Icon name="heart" size={13} /> Favoritos</span>}
              </div>
              <label className="catalog-sort"><span>Ordenar:</span><select aria-label="Ordenar productos" onChange={(event) => setSortBy(event.target.value)} value={sortBy}><option value="featured">Recomendados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option></select></label>
            </div>

            {loading ? (
              <div className="empty-results" role="status"><h3>Cargando productos...</h3></div>
            ) : error ? (
              <div className="empty-results" role="alert">
                <h3>No pudimos cargar el catálogo</h3>
                <p>{error}</p>
                <button className="button button-outline" onClick={onRetry} type="button">Reintentar</button>
              </div>
            ) : filteredProducts.length ? (
              <div aria-live="polite" className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    isFavorite={favorites.includes(product.id)}
                    key={product.id}
                    onAdd={onAddToCart}
                    onFavorite={onFavorite}
                    product={product}
                    quantity={cartItems.find((item) => Number(item.ProductoID) === product.id)?.Cantidad || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <span aria-hidden="true">🔎</span><h3>{!products.length ? 'Aún no hay productos publicados' : 'No encontramos coincidencias'}</h3>
                <p>{!products.length
                  ? 'Cuando las tiendas publiquen productos, aparecerán aquí.'
                  : favoritesOnly
                  ? 'Los favoritos solo se conservan durante esta sesión porque la API actual no los persiste.'
                  : 'Ajusta tus filtros o prueba otra búsqueda.'}</p>
                {hasActiveFilters && <button className="button button-outline" onClick={clearFilters} type="button">Limpiar filtros</button>}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="catalog-footer">
        <span>© 2026 ClickMarket · Encuentra algo para ti</span>
        <button onClick={onHome} type="button">Volver al inicio <Icon name="arrow" size={15} /></button>
      </footer>
    </div>
  )
}

export default CatalogPage
