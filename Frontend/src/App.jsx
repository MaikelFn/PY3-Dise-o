import { useEffect, useState } from 'react'
import {
  FiBell,
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiBox,
  FiDollarSign,
  FiEdit3,
  FiEye,
  FiGrid,
  FiHome,
  FiMail,
  FiMapPin,
  FiMinus,
  FiMonitor,
  FiPackage,
  FiPlus,
  FiSave,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiBriefcase,
  FiTrash2,
  FiUser,
  FiX,
  FiLogOut,
  FiZap
} from 'react-icons/fi'
import {
  addCartItem,
  approvePayment,
  clearCart,
  createCategory,
  createAddress,
  createOrder,
  createSeller,
  getNotifications,
  registerPayment,
  markNotificationRead,
  markAllNotificationsRead,
  getAddresses,
  getAdminOrders,
  getCartItems,
  getCategories,
  getOrders,
  getOrderPayments,
  getOrderShipping,
  getProducts,
  getSession,
  getShippingTypes,
  getSellers,
  getSellerOrders,
  getRoles,
  getUsers,
  getPaymentMethods,
  login,
  logout,
  register,
  removeCartItem,
  publishProduct,
  rejectPayment,
  assignUserRole,
  deactivateUser,
  getUser,
  getProduct,
  getProductImages,
  getProductInventory,
  getSeller,
  getOrder,
  getOrderDetails,
  getPayment,
  getShipping,
  getNotification,
  updateCategory,
  updateShippingState,
  updateCartItem,
  deactivateProduct,
  updateAddress,
  deleteAddress,
  cancelOrder,
  updateProduct,
  updateSeller,
  updateUser,
  addProductStock,
  addProductImage,
  setMainProductImage,
  deleteProductImage,
  getOrderStates,
  deactivateSeller,
  resolveImageUrl
} from './api'
import clickMarketLogo from './assets/clickmarket-logo.png'
import './App.css'

function getCategoryIcon(categoryName) {
  const name = String(categoryName || '').toLowerCase()
  if (name.includes('comput')) return FiMonitor
  if (name.includes('deport')) return FiActivity
  if (name.includes('electr')) return FiZap
  if (name.includes('hogar')) return FiHome
  if (name.includes('ropa') || name.includes('moda')) return FiShoppingBag
  return FiGrid
}

function App() {
  const [sessionLoading, setSessionLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState('home')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [catalogProducts, setCatalogProducts] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [shippingTypes, setShippingTypes] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [selectedShippingTypeId, setSelectedShippingTypeId] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('')
  const [checkoutStep, setCheckoutStep] = useState('form')
  const [newAddress, setNewAddress] = useState({
    provincia: '',
    canton: '',
    distrito: '',
    detalle: ''
  })
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [seller, setSeller] = useState(null)
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerOrders, setSellerOrders] = useState([])
  const [adminOrders, setAdminOrders] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedPaymentIds, setSelectedPaymentIds] = useState({})
  const [openPaymentIds, setOpenPaymentIds] = useState({})
  const [shippingStates, setShippingStates] = useState({})
  const [notifications, setNotifications] = useState([])
  const [orderDetails, setOrderDetails] = useState({})
  const [openOrderDetailsIds, setOpenOrderDetailsIds] = useState({})
  const [openSellerOrderIds, setOpenSellerOrderIds] = useState({})
  const [selectedProductDetail, setSelectedProductDetail] = useState(null)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addingAddress, setAddingAddress] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [categoryDetail, setCategoryDetail] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [sellerEdit, setSellerEdit] = useState({ nombreComercial: '', descripcion: '' })
  const [profileEdit, setProfileEdit] = useState({ nombre: '', apellido: '', correo: '' })
  const [stockToAdd, setStockToAdd] = useState('')
  const [orderStates, setOrderStates] = useState([])
  const [sellerList, setSellerList] = useState([])
  const [productImages, setProductImages] = useState([])
  const [newProductImage, setNewProductImage] = useState(null)
  const [userRoleForm, setUserRoleForm] = useState({ userId: '', rolId: '' })
  const [selectedUser, setSelectedUser] = useState(null)
  const [adminSection, setAdminSection] = useState('orders')
  const [users, setUsers] = useState([])
  const [userFilter, setUserFilter] = useState('')
  const [categoryForm, setCategoryForm] = useState({ categoryId: '', nombre: '', descripcion: '' })
  const [sellerForm, setSellerForm] = useState({ nombreComercial: '', descripcion: '' })
  const [productForm, setProductForm] = useState({
    categoriaID: '',
    nombre: '',
    descripcion: '',
    precio: '',
    cantidad: '',
    imagen: null
  })

  const checkoutSubtotal = cartItems.reduce((total, item) =>
    total + Number(item.Subtotal ?? item.subtotal ??
      (Number(item.Precio ?? item.precio ?? 0) *
        Number(item.Cantidad ?? item.cantidad ?? 0))),
  0)
  const selectedAddress = addresses.find(
    (address) => String(address.DireccionID) === selectedAddressId
  )
  const selectedShipping = shippingTypes.find(
    (type) => String(type.TipoEnvioID) === selectedShippingTypeId
  )
  const selectedPaymentMethod = paymentMethods.find(
    (method) => String(method.MetodoPagoID) === selectedPaymentMethodId
  )
  const checkoutShippingCost = Number(selectedShipping?.Costo || 0)
  const shopCategories = categories.filter((category) =>
    catalogProducts.some((product) =>
      String(product.CategoriaID) === String(category.CategoriaID)
    )
  )

  useEffect(() => {
    getSession()
      .then(setUser)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setSessionLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([getCategories(), getProducts()])
      .then(([nextCategories, nextProducts]) => {
        setCategories(nextCategories)
        setProducts(nextProducts)
        setCatalogProducts(nextProducts)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCatalogLoading(false))
  }, [])

  useEffect(() => {
    if (!user) {
      setCartItems([])
      setNotifications([])
      return
    }

    setCartLoading(true)
    getCartItems()
      .then(setCartItems)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setCartLoading(false))

    getNotifications()
      .then(setNotifications)
      .catch((requestError) => setError(requestError.message))
  }, [user])

  async function filterProducts(event, nextCategoryId = categoryId, nextSearch = search) {
    event?.preventDefault()
    setCatalogLoading(true)
    setError('')
    setCategoryId(nextCategoryId)
    setSelectedProductDetail(null)
    try {
      setProducts(await getProducts({
        categoryId: nextCategoryId || undefined,
        search: nextSearch
      }))
      setCategoryDetail(
        categories.find((category) => String(category.CategoriaID) === String(nextCategoryId)) || null
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCatalogLoading(false)
    }
  }

  async function browseCategory(nextCategoryId) {
    setView('search')
    await filterProducts(null, nextCategoryId, search)
    document.getElementById('search-page-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  async function returnHome() {
    setView('home')
    setSearch('')
    setSelectedProductDetail(null)
    await filterProducts(null, '', '')
  }

  async function openSearch(event) {
    event?.preventDefault()
    setView('search')
    await filterProducts(null, categoryId, search)
    document.getElementById('search-page-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  async function openFullCatalog() {
    setSearch('')
    setView('search')
    await filterProducts(null, '', '')
    document.getElementById('search-page-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  async function handleAddToCart(productoID) {
    if (!user) {
      setView('account')
      setError('Inicia sesión para agregar productos al carrito.')
      return
    }

    setBusy(true)
    setError('')
    try {
      setCartItems(await addCartItem(productoID))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateCart(productoID, cantidad) {
    setBusy(true)
    setError('')
    try {
      setCartItems(await updateCartItem(productoID, cantidad))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveCartItem(productoID) {
    setBusy(true)
    setError('')
    try {
      setCartItems(await removeCartItem(productoID))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleClearCart() {
    setBusy(true)
    setError('')
    try {
      setCartItems(await clearCart())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openCheckout() {
    setView('checkout')
    setCheckoutStep('form')
    setBusy(true)
    setError('')
    try {
      const [nextAddresses, nextShippingTypes, nextPaymentMethods] = await Promise.all([
        getAddresses(),
        getShippingTypes(),
        getPaymentMethods()
      ])
      setAddresses(nextAddresses)
      setShippingTypes(nextShippingTypes)
      setPaymentMethods(nextPaymentMethods)
      setSelectedAddressId(
        String(
          nextAddresses.find((address) => address.Principal)?.DireccionID ||
          nextAddresses[0]?.DireccionID ||
          ''
        )
      )
      setSelectedShippingTypeId(String(nextShippingTypes[0]?.TipoEnvioID || ''))
      setSelectedPaymentMethodId(String(nextPaymentMethods[0]?.MetodoPagoID || ''))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateAddress(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
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
      setMessage('Dirección agregada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateOrder() {
    if (!selectedAddressId || !selectedShippingTypeId || !selectedPaymentMethodId) {
      setError('Selecciona una dirección, un tipo de envío y un método de pago.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await createOrder({
        direccionID: Number(selectedAddressId),
        tipoEnvioID: Number(selectedShippingTypeId)
      })
      await registerPayment(response.pedidoID, Number(selectedPaymentMethodId))
      setCartItems([])
      setMessage(`Pedido #${response.pedidoID} creado y pago registrado como pendiente.`)
      setView('orders')
      const loadedOrders = await getOrders()
      setOrders(loadedOrders)
      loadedOrders.forEach((order) => openOrderDetails(order.PedidoID, true))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openOrders() {
    setView('orders')
    setOrdersLoading(true)
    setError('')
    try {
      const loadedOrders = await getOrders()
      setOrders(loadedOrders)
      loadedOrders.forEach((order) => {
        openOrderDetails(order.PedidoID, true)
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setOrdersLoading(false)
    }
  }

  async function openOrderDetails(orderId, silent = false) {
    if (!silent) setBusy(true)
    setError('')
    try {
      const [order, details, payments, shipping] = await Promise.all([
        getOrder(orderId),
        getOrderDetails(orderId),
        getOrderPayments(orderId).catch(() => []),
        getOrderShipping(orderId).catch(() => null)
      ])
      const shippingDetail = shipping
        ? await getShipping(shipping.EnvioID ?? shipping.envioid).catch(() => shipping)
        : null
      const [addresses, products, paymentDetails] = await Promise.all([
        getAddresses(),
        Promise.all(details.map((detail) =>
          getProduct(detail.ProductoID).catch(() => null)
        )),
        Promise.all(payments.map((payment) =>
          getPayment(payment.PagoID).catch(() => payment)
        ))
      ])
      const address = addresses.find(
        (item) => Number(item.DireccionID) === Number(order.DireccionID)
      )
      setOrderDetails((current) => ({
        ...current,
        [orderId]: {
          order,
          details,
          payments: paymentDetails,
          shipping: shippingDetail,
          address,
          products
        }
      }))
    } catch (requestError) {
      if (!silent) setError(requestError.message)
    } finally {
      if (!silent) setBusy(false)
    }
  }

  async function handleCancelOrder(orderId) {
    setBusy(true)
    setError('')
    try {
      await cancelOrder(orderId)
      if (user?.rol === 'Administrador') {
        setAdminOrders(await getAdminOrders())
      } else {
        setOrders(await getOrders())
      }
      setOrderDetails((current) => {
        const next = { ...current }
        delete next[orderId]
        return next
      })
      setOpenOrderDetailsIds((current) => {
        const next = { ...current }
        delete next[orderId]
        return next
      })
      setMessage(`Pedido #${orderId} cancelado.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openProductDetail(productId) {
    setView('search')
    setBusy(true)
    setError('')
    try {
      const [product, images, inventory] = await Promise.all([
        getProduct(productId),
        getProductImages(productId).catch(() => []),
        getProductInventory(productId).catch(() => null)
      ])
      setSelectedProductDetail({ product, images, inventory })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openAccount() {
    setView('account')
    setAddingAddress(false)
    setBusy(true)
    setError('')
    try {
      if (user) {
        setProfileEdit({
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          correo: user.correo || ''
        })
        setAddresses(await getAddresses())
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateAddress(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await updateAddress(editingAddress.DireccionID, {
        provincia: editingAddress.Provincia,
        canton: editingAddress.Canton,
        distrito: editingAddress.Distrito,
        detalle: editingAddress.Detalle,
        principal: editingAddress.Principal
      })
      setAddresses(await getAddresses())
      setEditingAddress(null)
      setMessage('Dirección actualizada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSetMainAddress(addressId) {
    const address = addresses.find((item) => Number(item.DireccionID) === Number(addressId))
    if (!address) return

    setBusy(true)
    setError('')
    try {
      await updateAddress(addressId, {
        provincia: address.Provincia,
        canton: address.Canton,
        distrito: address.Distrito,
        detalle: address.Detalle,
        principal: true
      })
      setAddresses(await getAddresses())
      setMessage('Dirección principal actualizada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteAddress(addressId) {
    setBusy(true)
    setError('')
    try {
      await deleteAddress(addressId)
      setAddresses(await getAddresses())
      setEditingAddress(null)
      setMessage('Dirección eliminada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openNotifications() {
    setView('notifications')
    setMessage('')
    setSelectedNotification(null)
    setBusy(true)
    setError('')
    try {
      setNotifications(await getNotifications())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleMarkNotificationRead(notificationId) {
    setBusy(true)
    setError('')
    try {
      await markNotificationRead(notificationId)
      setNotifications(await getNotifications())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleMarkAllNotificationsRead() {
    setBusy(true)
    setError('')
    try {
      await markAllNotificationsRead()
      setNotifications(await getNotifications())
      setMessage('Todas las notificaciones fueron marcadas como leídas.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openNotification(notificationId) {
    setBusy(true)
    setError('')
    try {
      const notification = await getNotification(notificationId)
      setSelectedNotification(notification)
      await markNotificationRead(notificationId)
      setNotifications(await getNotifications())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openSeller() {
    if (user?.rol !== 'Vendedor') {
      setError('Tu cuenta debe tener el rol Vendedor.')
      setView('home')
      return
    }

    setView('seller')
    setBusy(true)
    setError('')
    try {
      const sellers = await getSellers()
      const currentSeller = sellers.find((item) => Number(item.UsuarioID) === Number(user.id))
      setSeller(currentSeller ? await getSeller(currentSeller.VendedorID) : null)
      if (currentSeller) {
        setSellerEdit({
          nombreComercial: currentSeller.NombreComercial || '',
          descripcion: currentSeller.Descripcion || ''
        })
      }

      if (currentSeller) {
        const [nextProducts, nextOrders] = await Promise.all([
          getProducts({ vendorId: currentSeller.VendedorID }),
          getSellerOrders()
        ])
        setSellerProducts(nextProducts)
        setSellerOrders(nextOrders)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateSeller(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await createSeller(sellerForm)
      setSeller(response.vendedor)
      setSellerForm({ nombreComercial: '', descripcion: '' })
      setMessage('Perfil de vendedor creado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateSeller(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await updateSeller(seller.VendedorID, sellerEdit)
      setSeller(response.vendedor)
      setMessage('Perfil de tienda actualizado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateProduct(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await updateProduct(editingProduct.ProductoID, {
        categoriaID: Number(editingProduct.CategoriaID),
        nombre: editingProduct.Nombre,
        descripcion: editingProduct.Descripcion || '',
        precio: Number(editingProduct.Precio)
      })
      setSellerProducts(await getProducts({ vendorId: seller.VendedorID }))
      setCatalogProducts(await getProducts())
      setEditingProduct(null)
      setMessage('Producto actualizado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddStock(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await addProductStock(editingProduct.ProductoID, Number(stockToAdd))
      setSellerProducts(await getProducts({ vendorId: seller.VendedorID }))
      setStockToAdd('')
      setMessage('Existencias agregadas.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openProductImages(product) {
    setEditingProduct({ ...product })
    setNewProductImage(null)
    setBusy(true)
    setError('')
    try {
      setProductImages(await getProductImages(product.ProductoID))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddProductImage(event) {
    event.preventDefault()
    if (!editingProduct || !newProductImage) {
      setError('Selecciona una imagen.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await addProductImage(editingProduct.ProductoID, {
        imagen: newProductImage,
        esPrincipal: productImages.length === 0,
        orden: productImages.length
      })
      setProductImages(await getProductImages(editingProduct.ProductoID))
      setNewProductImage(null)
      setMessage('Imagen agregada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSetMainImage(imageId) {
    setBusy(true)
    setError('')
    try {
      await setMainProductImage(imageId)
      setProductImages(await getProductImages(editingProduct.ProductoID))
      setMessage('Imagen principal actualizada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteProductImage(imageId) {
    setBusy(true)
    setError('')
    try {
      await deleteProductImage(imageId)
      setProductImages(await getProductImages(editingProduct.ProductoID))
      setMessage('Imagen eliminada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateProfile(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await updateUser(user.id, profileEdit)
      setUser((current) => ({
        ...current,
        nombre: response.usuario.Nombre,
        apellido: response.usuario.Apellido,
        correo: response.usuario.Correo
      }))
      setMessage('Perfil actualizado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handlePublishProduct(event) {
    event.preventDefault()
    if (!productForm.imagen) {
      setError('Selecciona una imagen.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await publishProduct({
        categoriaID: Number(productForm.categoriaID),
        nombre: productForm.nombre,
        descripcion: productForm.descripcion,
        precio: Number(productForm.precio),
        cantidad: Number(productForm.cantidad),
        image: productForm.imagen
      })
      setSellerProducts(await getProducts({ vendorId: seller.VendedorID }))
      setCatalogProducts(await getProducts())
      setProductForm({ categoriaID: '', nombre: '', descripcion: '', precio: '', cantidad: '', imagen: null })
      setMessage('Producto publicado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeactivateProduct(productId) {
    setBusy(true)
    setError('')
    try {
      await deactivateProduct(productId)
      setSellerProducts(await getProducts({ vendorId: seller.VendedorID }))
      setCatalogProducts(await getProducts())
      setMessage('Producto desactivado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openAdmin() {
    if (user?.rol !== 'Administrador') {
      setError('Tu cuenta debe tener el rol Administrador.')
      setView('home')
      return
    }

    setView('admin')
    setAdminSection('orders')
    setBusy(true)
    setError('')
    try {
      const [nextOrders, nextRoles, nextUsers, nextStates, nextSellers] = await Promise.all([
        getAdminOrders(),
        getRoles(),
        getUsers(),
        getOrderStates(),
        getSellers()
      ])
      setAdminOrders(nextOrders)
      setRoles(nextRoles)
      setUsers(nextUsers)
      setOrderStates(nextStates)
      setSellerList(nextSellers)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAssignUserRole() {
    if (!selectedUser) {
      setError('Consulta primero un usuario.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await assignUserRole(selectedUser.UsuarioID, Number(userRoleForm.rolId))
      setMessage(`Rol asignado al usuario ${selectedUser.Nombre} ${selectedUser.Apellido}.`)
      setSelectedUser(response.usuario)
      setUserRoleForm({ userId: '', rolId: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeactivateUser() {
    if (!selectedUser) {
      setError('Consulta primero un usuario.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const response = await deactivateUser(selectedUser.UsuarioID)
      setMessage(`Usuario ${selectedUser.Nombre} ${selectedUser.Apellido} desactivado.`)
      setSelectedUser(response.usuario)
      setUserRoleForm({ userId: '', rolId: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSearchUser(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSelectedUser(null)
    try {
      const response = await getUser(Number(userRoleForm.userId))
      setSelectedUser(response.usuario)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeactivateSeller(sellerId) {
    setBusy(true)
    setError('')
    try {
      await deactivateSeller(sellerId)
      setSellerList(await getSellers())
      setMessage('Perfil de vendedor desactivado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveCategory(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const details = {
        nombre: categoryForm.nombre,
        descripcion: categoryForm.descripcion
      }

      if (categoryForm.categoryId) {
        await updateCategory(Number(categoryForm.categoryId), details)
        setMessage('Categoría actualizada.')
      } else {
        await createCategory(details)
        setMessage('Categoría creada.')
      }

      setCategories(await getCategories())
      setCategoryForm({ categoryId: '', nombre: '', descripcion: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleApprovePayment(orderId, paymentId) {
    setBusy(true)
    setError('')
    try {
      await approvePayment(paymentId)
      setAdminOrders(await getAdminOrders())
      setSelectedPaymentIds((current) => ({ ...current, [orderId]: [] }))
      setOpenPaymentIds((current) => ({ ...current, [orderId]: false }))
      setMessage(`Pago #${paymentId} aprobado.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRejectPayment(orderId, paymentId) {
    setBusy(true)
    setError('')
    try {
      await rejectPayment(paymentId)
      setAdminOrders(await getAdminOrders())
      setSelectedPaymentIds((current) => ({ ...current, [orderId]: [] }))
      setOpenPaymentIds((current) => ({ ...current, [orderId]: false }))
      setMessage(`Pago #${paymentId} rechazado.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function loadOrderPayments(orderId) {
    setBusy(true)
    setError('')
    try {
      const [payments, shipping] = await Promise.all([
        getOrderPayments(orderId),
        getOrderShipping(orderId)
      ])
      setSelectedPaymentIds((current) => ({ ...current, [orderId]: payments }))
      setOpenPaymentIds((current) => ({ ...current, [orderId]: true }))
      setShippingStates((current) => ({
        ...current,
        [orderId]: shipping?.Estado ?? shipping?.estado ?? null
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateShipping(orderId) {
    setBusy(true)
    setError('')
    try {
      const shipping = await getOrderShipping(orderId)
      const shippingId = shipping.EnvioID ?? shipping.envioid
      if (!shippingId) throw new Error('El pedido no tiene envío asociado.')

      const currentState = shipping.Estado ?? shipping.estado
      let nextState

      if (!currentState || currentState === 'Pendiente') {
        nextState = 'Preparando'
      } else if (currentState === 'Preparando') {
        nextState = 'Enviado'
      } else if (currentState === 'Enviado') {
        nextState = 'Entregado'
      } else {
        setMessage(`El envío del pedido #${orderId} ya está entregado.`)
        return
      }

      await updateShippingState(shippingId, nextState)
      setShippingStates((current) => ({ ...current, [orderId]: nextState }))
      setMessage(`Envio del pedido #${orderId} actualizado a ${nextState}.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())

    try {
      if (mode === 'register') {
        await register(values)
        setMessage('Cuenta creada. Ahora inicia sesión.')
        setMode('login')
      } else {
        const data = await login({
          correo: values.correo,
          contrasena: values.contrasena
        })
        setUser(data.usuario)
        setMessage('Sesión iniciada.')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      await logout()
      setUser(null)
      setMode('login')
      setMessage('Sesión cerrada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function renderProductCards(productList) {
    return (
      <div className="catalog-grid shop-product-grid">
        {productList.map((product) => {
          const stock = Number(product.CantidadDisponible || 0)
          return (
            <article className="catalog-card shop-product-card" key={product.ProductoID}>
              <div className="shop-product-image">
                {product.ImagenURL ? (
                  <img alt={product.Nombre} src={resolveImageUrl(product.ImagenURL)} />
                ) : (
                  <span aria-hidden="true">CM</span>
                )}
                <span className={`shop-stock-badge${stock < 1 ? ' is-unavailable' : ''}`}>
                  {stock > 0 ? 'Disponible' : 'Agotado'}
                </span>
              </div>
              <div className="shop-product-body">
                <h3>{product.Nombre}</h3>
                <p>{product.Descripcion || 'Descubre más detalles de este producto.'}</p>
                <div className="shop-product-meta">
                  <strong>₡{Number(product.Precio || 0).toLocaleString('es-CR')}</strong>
                  <span>{stock > 0 ? `${stock} disponibles` : 'Sin existencias'}</span>
                </div>
                <div className="shop-product-actions">
                  <button
                    aria-label={`Ver detalles de ${product.Nombre}`}
                    className="admin-action-button admin-action-secondary"
                    disabled={busy}
                    onClick={() => openProductDetail(product.ProductoID)}
                    type="button"
                  >
                    Ver detalles
                  </button>
                  <button
                    aria-label={`Agregar ${product.Nombre} al carrito`}
                    className="dialog-primary"
                    disabled={busy || stock < 1}
                    onClick={() => handleAddToCart(product.ProductoID)}
                    type="button"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  const cartCount = cartItems.reduce((total, item) => total + Number(item.Cantidad ?? item.cantidad ?? 0), 0)
  const unreadNotificationCount = notifications.filter((notification) =>
    ![true, 1, '1', 'true'].includes(notification.Leida ?? notification.leida)
  ).length

  if (sessionLoading) {
    return (
      <div className="storefront">
        <main className="account-main"><section className="app-dialog"><p>Cargando sesión...</p></section></main>
      </div>
    )
  }

  return (
    <div className="storefront">
      <div className="announcement-bar">
        <p>Envíos a todo Costa Rica <span className="announcement-divider">|</span> Compra fácil, recibe en casa</p>
      </div>

      <header className="site-header">
        <div className="header-main">
          <a aria-label="ClickMarket, ir al inicio" className="brand-link" href="/">
            <img alt="ClickMarket" src={clickMarketLogo} />
          </a>
          <form className="search-form" onSubmit={openSearch} role="search">
            <input
              aria-label="Buscar productos"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tu próximo producto está aquí"
              value={search}
            />
            <button type="submit"><FiSearch aria-hidden="true" />Buscar</button>
          </form>
          <nav aria-label="Acciones de cuenta" className="header-actions">
            {user && (
              <button className={`header-link${cartCount > 0 ? ' has-items' : ''}`} type="button" onClick={() => setView('cart')}>
                <FiShoppingCart aria-hidden="true" />Carrito
                {cartCount > 0 && <span aria-label={`${cartCount} productos en el carrito`} className="header-count">{cartCount}</span>}
              </button>
            )}
            {user && (
              <button className="header-link" type="button" onClick={openOrders}>
                <FiPackage aria-hidden="true" />Mis pedidos
              </button>
            )}
            {user && (
              <button className={`header-link${unreadNotificationCount > 0 ? ' has-items' : ''}`} type="button" onClick={openNotifications}>
                <FiBell aria-hidden="true" />Notificaciones
                {unreadNotificationCount > 0 && <span aria-label={`${unreadNotificationCount} notificaciones sin leer`} className="header-count">{unreadNotificationCount}</span>}
              </button>
            )}
            {user?.rol === 'Vendedor' && (
              <button className="header-link" type="button" onClick={openSeller}>
                Mi tienda
              </button>
            )}
            {user?.rol === 'Administrador' && (
              <button className="header-link" type="button" onClick={openAdmin}>
                Administración
              </button>
            )}
            <button className="header-link" type="button" onClick={openAccount}>
              <FiUser aria-hidden="true" />{user ? 'Mi cuenta' : 'Iniciar sesión'}
            </button>
          </nav>
        </div>
        {(view === 'home' || view === 'search') && (
          <nav aria-label="Explorar catálogo" className="shop-category-nav">
            <div className="shop-category-nav-inner">
              <button
                className={view === 'home' ? 'is-active' : ''}
                onClick={returnHome}
                type="button"
              >
                Inicio
              </button>
              <a href={view === 'home' ? '#shop-categories' : '#catalog-filters'}>
                {view === 'home' ? 'Categorías' : 'Filtros'}
              </a>
              <button
                className={view === 'search' ? 'is-active' : ''}
                onClick={openFullCatalog}
                type="button"
              >
                Catálogo
              </button>
              {shopCategories.map((category) => {
                const id = String(category.CategoriaID)
                return (
                  <button
                    aria-pressed={categoryId === id}
                    className={categoryId === id ? 'is-active' : ''}
                    key={category.CategoriaID}
                    onClick={() => browseCategory(id)}
                    type="button"
                  >
                    {category.Nombre}
                  </button>
                )
              })}
            </div>
          </nav>
        )}
      </header>

      <main className={view === 'account' ? 'account-main' : 'page-main'}>
        {view === 'notifications' ? (
          <section className="catalog-view shop-notifications-page" aria-labelledby="notifications-title">
            <div className="shop-orders-heading shop-notifications-heading">
              <div>
                <span className="shop-section-eyebrow">ACTUALIZACIONES DE TU CUENTA</span>
                <h2 id="notifications-title">Notificaciones</h2>
              </div>
              {notifications.length > 0 && (
                <span className="shop-orders-count">
                  {unreadNotificationCount} sin leer
                </span>
              )}
            </div>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {message && <p className="dialog-notice" role="status">{message}</p>}
            {busy ? (
              <div className="shop-notifications-list" aria-label="Cargando notificaciones">
                {[1, 2, 3].map((item) => <div className="shop-notification-skeleton" key={item} />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="shop-empty-state shop-orders-empty">
                <span aria-hidden="true"><FiBell /></span>
                <h3>No tienes notificaciones</h3>
                <p>Las novedades de tus pedidos aparecerán aquí.</p>
              </div>
            ) : (
              <div className="shop-notifications-layout">
                <div className="shop-notifications-toolbar">
                  <span>{notifications.length} {notifications.length === 1 ? 'actualización' : 'actualizaciones'}</span>
                  {unreadNotificationCount > 0 && (
                    <button className="shop-notification-mark-all" disabled={busy} onClick={handleMarkAllNotificationsRead} type="button">
                      <FiCheck aria-hidden="true" />Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="shop-notifications-list">
                  {notifications.map((notification) => {
                    const notificationId = notification.NotificacionID ?? notification.notificacionid
                    const isRead = [true, 1, '1', 'true'].includes(notification.Leida ?? notification.leida)
                    const title = notification.Titulo ?? notification.titulo
                    const messageText = notification.Mensaje ?? notification.mensaje
                    const isSelected = (selectedNotification?.NotificacionID ?? selectedNotification?.notificacionid) === notificationId
                    return (
                      <article className={`shop-notification-card${isRead ? '' : ' is-unread'}${isSelected ? ' is-selected' : ''}`} key={notificationId}>
                        <button
                          className="shop-notification-main"
                          disabled={busy}
                          onClick={() => openNotification(notificationId)}
                          type="button"
                        >
                          <span className="shop-notification-icon" aria-hidden="true"><FiBell /></span>
                          <span className="shop-notification-copy">
                            <strong>{title}</strong>
                            <span>{messageText}</span>
                          </span>
                          {!isRead && <span className="shop-notification-dot" aria-label="No leída" />}
                        </button>
                        {!isRead && (
                          <button
                            className="shop-notification-read"
                            disabled={busy}
                            onClick={() => handleMarkNotificationRead(notificationId)}
                            type="button"
                            aria-label={`Marcar ${title} como leída`}
                          >
                            <FiCheck aria-hidden="true" />
                          </button>
                        )}
                        {isSelected && (
                          <div className="shop-notification-inline-detail">
                            <span>{messageText}</span>
                            <button type="button" onClick={() => setSelectedNotification(null)} aria-label="Cerrar detalle">
                              <FiX />
                            </button>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        ) : view === 'admin' ? (
          <section className="catalog-view" aria-labelledby="admin-title">
            <h2 id="admin-title">Administración</h2>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {message && <p className="dialog-notice" role="status">{message}</p>}
            <nav className="admin-tabs" aria-label="Secciones de administración">
              <button className={adminSection === 'orders' ? 'is-active' : ''} onClick={() => setAdminSection('orders')} type="button">Pedidos</button>
              <button className={adminSection === 'catalog' ? 'is-active' : ''} onClick={() => setAdminSection('catalog')} type="button">Catálogo</button>
              <button className={adminSection === 'users' ? 'is-active' : ''} onClick={() => setAdminSection('users')} type="button">Usuarios</button>
            </nav>
            {adminSection === 'orders' && orderStates.length > 0 && (
              <p>Estados disponibles: {orderStates.map((state) => state.Nombre ?? state.nombre).filter(Boolean).join(', ')}</p>
            )}

            {adminSection === 'orders' && (
              busy ? <p>Cargando pedidos...</p> : adminOrders.length === 0 ? <p>No hay pedidos registrados.</p> : (
                <div className="admin-grid">
                  {adminOrders.map((order) => {
                    const payments = selectedPaymentIds[order.PedidoID] || []
                    const isPaymentOpen = Boolean(openPaymentIds[order.PedidoID])
                    const shippingState = shippingStates[order.PedidoID]
                    const nextShippingLabel =
                      shippingState === 'Preparando' ? 'Marcar envío enviado'
                        : shippingState === 'Enviado' ? 'Marcar envío entregado'
                          : 'Marcar envío preparando'
                    return (
                      <article className="admin-order-card" key={order.PedidoID}>
                        <div className="admin-order-heading">
                          <h3>Pedido #{order.PedidoID}</h3>
                          <span className="admin-order-status">{order.Estado}</span>
                        </div>
                        <p className="admin-order-buyer">Comprador: {order.Comprador}</p>
                        <strong className="admin-order-total">₡{Number(order.Total || 0).toLocaleString('es-CR')}</strong>
                        <div className="admin-order-actions">
                          <button
                            aria-expanded={isPaymentOpen}
                            className="admin-action-button admin-action-secondary"
                            disabled={busy}
                            onClick={() => {
                              if (isPaymentOpen) {
                                setOpenPaymentIds((current) => ({ ...current, [order.PedidoID]: false }))
                              } else {
                                loadOrderPayments(order.PedidoID)
                              }
                            }}
                            type="button"
                          >
                            {isPaymentOpen ? 'Cerrar pago' : 'Revisar pago'}
                          </button>
                          <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => openOrderDetails(order.PedidoID)} type="button">Ver detalles</button>
                          {!['Cancelado', 'Entregado'].includes(order.Estado) && (
                            <button className="admin-action-button" disabled={busy} onClick={() => handleCancelOrder(order.PedidoID)} type="button">Cancelar pedido</button>
                          )}
                          {shippingState !== 'Entregado' && shippingState != null && (
                            <button className="admin-action-button" disabled={busy} onClick={() => handleUpdateShipping(order.PedidoID)} type="button">{nextShippingLabel}</button>
                          )}
                        </div>
                        {isPaymentOpen && payments.map((payment) => (
                          <div className="admin-payment" key={payment.PagoID}>
                            <p>Pago #{payment.PagoID}</p>
                            <span className="admin-payment-status">{payment.Estado}</span>
                            {payment.Estado === 'Pendiente' && (
                              <div className="admin-payment-actions">
                                <button className="admin-action-button" disabled={busy} onClick={() => handleApprovePayment(order.PedidoID, payment.PagoID)} type="button">Aprobar</button>
                                <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => handleRejectPayment(order.PedidoID, payment.PagoID)} type="button">Rechazar</button>
                              </div>
                            )}
                          </div>
                        ))}
                        {isPaymentOpen && selectedPaymentIds[order.PedidoID] && payments.length === 0 && (
                          <p>Este pedido no tiene pagos registrados.</p>
                        )}
                        {orderDetails[order.PedidoID] && (
                          <div className="admin-payment">
                            {orderDetails[order.PedidoID].address && (
                              <p>
                                Enviar a: {orderDetails[order.PedidoID].address.Detalle}, {orderDetails[order.PedidoID].address.Distrito}, {orderDetails[order.PedidoID].address.Canton}, {orderDetails[order.PedidoID].address.Provincia}
                              </p>
                            )}
                            {orderDetails[order.PedidoID].details.map((detail, index) => {
                              const product = orderDetails[order.PedidoID].products[index]
                              return (
                                <p key={detail.DetallePedidoID}>
                                  {product?.Nombre || `Producto #${detail.ProductoID}`} · {detail.Cantidad} × ₡{Number(detail.PrecioUnitario).toLocaleString('es-CR')}
                                </p>
                              )
                            })}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )
            )}

            {adminSection === 'catalog' && (
              <div>
                <h3>Categorías</h3>
                <form className="checkout-address-form" onSubmit={handleSaveCategory}>
                  <label>Categoría existente
                    <select value={categoryForm.categoryId} onChange={(event) => {
                      const categoryId = event.target.value
                      const category = categories.find((item) => String(item.CategoriaID) === categoryId)
                      setCategoryForm({ categoryId, nombre: category?.Nombre || '', descripcion: category?.Descripcion || '' })
                    }}>
                      <option value="">Nueva categoría</option>
                      {categories.map((category) => (
                        <option key={category.CategoriaID} value={category.CategoriaID}>{category.Nombre}</option>
                      ))}
                    </select>
                  </label>
                  <label>Nombre<input value={categoryForm.nombre} onChange={(event) => setCategoryForm({ ...categoryForm, nombre: event.target.value })} required /></label>
                  <label>Descripción<input value={categoryForm.descripcion} onChange={(event) => setCategoryForm({ ...categoryForm, descripcion: event.target.value })} /></label>
                  <button className="admin-action-button" disabled={busy} type="submit">
                    {categoryForm.categoryId ? 'Actualizar categoría' : 'Crear categoría'}
                  </button>
                </form>
                <h3>Perfiles de vendedor</h3>
                <div className="admin-users-grid">
                  {sellerList.map((sellerItem) => (
                    <article className="admin-user-card" key={sellerItem.VendedorID}>
                      <h4>{sellerItem.NombreComercial}</h4>
                      <p>{sellerItem.Descripcion || 'Sin descripción'}</p>
                      <button className="admin-action-button" disabled={busy || !sellerItem.Activo} onClick={() => handleDeactivateSeller(sellerItem.VendedorID)} type="button">
                        Desactivar vendedor
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {adminSection === 'users' && (
              <div>
                <h3>Usuarios</h3>
                <label className="admin-filter">
                  Buscar usuario
                  <input value={userFilter} onChange={(event) => setUserFilter(event.target.value)} placeholder="Nombre, correo o rol" />
                </label>
                <div className="admin-users-grid">
                  {users.filter((item) => {
                    const text = `${item.Nombre} ${item.Apellido} ${item.Correo} ${item.Rol}`.toLowerCase()
                    return text.includes(userFilter.toLowerCase())
                  }).map((item) => (
                    <article className="admin-user-card" key={item.UsuarioID}>
                      <h4>{item.Nombre} {item.Apellido}</h4>
                      <p>{item.Correo}</p>
                      <p>{item.Rol} · {item.Activo ? 'Activo' : 'Inactivo'}</p>
                      <label>Nuevo rol
                        <select onChange={(event) => setUserRoleForm({ userId: String(item.UsuarioID), rolId: event.target.value })} value={Number(userRoleForm.userId) === item.UsuarioID ? userRoleForm.rolId : ''}>
                          <option value="">Selecciona un rol</option>
                          {roles.map((role) => <option key={role.RolID} value={role.RolID}>{role.Nombre}</option>)}
                        </select>
                      </label>
                      <button className="admin-action-button" disabled={busy || Number(userRoleForm.userId) !== item.UsuarioID || !userRoleForm.rolId} onClick={() => {
                        setBusy(true)
                        setError('')
                        assignUserRole(item.UsuarioID, Number(userRoleForm.rolId))
                          .then(async () => {
                            setUsers(await getUsers())
                            setMessage(`Rol asignado a ${item.Nombre} ${item.Apellido}.`)
                          })
                          .catch((requestError) => setError(requestError.message))
                          .finally(() => setBusy(false))
                      }} type="button">Asignar rol</button>
                      <button className="admin-action-button admin-action-secondary" disabled={busy || !item.Activo} onClick={() => {
                        setBusy(true)
                        setError('')
                        deactivateUser(item.UsuarioID)
                          .then(async () => {
                            setUsers(await getUsers())
                            setMessage(`Usuario ${item.Nombre} ${item.Apellido} desactivado.`)
                          })
                          .catch((requestError) => setError(requestError.message))
                          .finally(() => setBusy(false))
                      }} type="button">Desactivar</button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : view === 'seller' ? (
          <section className="catalog-view shop-seller-page" aria-labelledby="seller-title">
            <div className="shop-orders-heading shop-seller-heading">
              <div>
                <span className="shop-section-eyebrow">GESTIÓN COMERCIAL</span>
                <h2 id="seller-title">Mi tienda</h2>
              </div>
              {seller && <span className="shop-orders-count">Vendedor activo</span>}
            </div>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {message && <p className="dialog-notice" role="status">{message}</p>}

            {!seller ? (
              <div className="shop-seller-create">
                <span className="shop-seller-create-icon" aria-hidden="true"><FiBriefcase /></span>
                <div>
                  <h3>Configura tu tienda</h3>
                  <p>Crea tu perfil comercial para publicar productos y recibir pedidos.</p>
                </div>
                <form className="checkout-address-form" onSubmit={handleCreateSeller}>
                  <label>Nombre comercial<input value={sellerForm.nombreComercial} onChange={(event) => setSellerForm({ ...sellerForm, nombreComercial: event.target.value })} required /></label>
                  <label>Descripción<input value={sellerForm.descripcion} onChange={(event) => setSellerForm({ ...sellerForm, descripcion: event.target.value })} /></label>
                  <button className="dialog-primary" disabled={busy} type="submit">
                    {busy ? 'Guardando...' : 'Crear perfil'}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="shop-seller-hero">
                  <span className="shop-seller-avatar" aria-hidden="true"><FiBriefcase /></span>
                  <div>
                    <h3>{seller.NombreComercial}</h3>
                    <p>{seller.Descripcion || 'Sin descripción comercial'}</p>
                  </div>
                </div>

                <div className="shop-seller-stats">
                  <article><FiBox aria-hidden="true" /><div><span>Productos</span><strong>{sellerProducts.length}</strong></div></article>
                  <article><FiPackage aria-hidden="true" /><div><span>Pedidos</span><strong>{sellerOrders.length}</strong></div></article>
                  <article><FiDollarSign aria-hidden="true" /><div><span>Ingresos</span><strong>₡{sellerOrders.reduce((total, order) => total + Number(order.SubtotalVendedor || 0), 0).toLocaleString('es-CR')}</strong></div></article>
                </div>

                <div className="shop-seller-tools">
                  <section className="shop-seller-card">
                    <h3>Editar perfil de tienda</h3>
                    <form className="checkout-address-form" onSubmit={handleUpdateSeller}>
                      <label>Nombre comercial<input value={sellerEdit.nombreComercial} onChange={(event) => setSellerEdit({ ...sellerEdit, nombreComercial: event.target.value })} required /></label>
                      <label>Descripción<input value={sellerEdit.descripcion} onChange={(event) => setSellerEdit({ ...sellerEdit, descripcion: event.target.value })} /></label>
                      <button className="admin-action-button" disabled={busy} type="submit"><FiSave />Guardar perfil</button>
                    </form>
                  </section>

                  <section className="shop-seller-card">
                    <h3>Publicar producto</h3>
                    <form className="checkout-address-form" onSubmit={handlePublishProduct}>
                      <label>Categoría
                        <select value={productForm.categoriaID} onChange={(event) => setProductForm({ ...productForm, categoriaID: event.target.value })} required>
                          <option value="">Selecciona una categoría</option>
                          {categories.map((category) => (
                            <option key={category.CategoriaID} value={category.CategoriaID}>{category.Nombre}</option>
                          ))}
                        </select>
                      </label>
                      <label>Nombre<input value={productForm.nombre} onChange={(event) => setProductForm({ ...productForm, nombre: event.target.value })} required /></label>
                      <label>Descripción<input value={productForm.descripcion} onChange={(event) => setProductForm({ ...productForm, descripcion: event.target.value })} /></label>
                      <label>Precio<input type="number" min="1" value={productForm.precio} onChange={(event) => setProductForm({ ...productForm, precio: event.target.value })} required /></label>
                      <label>Existencias<input type="number" min="1" value={productForm.cantidad} onChange={(event) => setProductForm({ ...productForm, cantidad: event.target.value })} required /></label>
                      <label>Imagen<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProductForm({ ...productForm, imagen: event.target.files?.[0] || null })} required /></label>
                      <button className="dialog-primary" disabled={busy} type="submit">
                        {busy ? 'Publicando...' : 'Publicar producto'}
                      </button>
                    </form>
                  </section>
                </div>

                <div className="shop-seller-section-heading">
                  <div><span className="shop-section-eyebrow">INVENTARIO</span><h3>Mis productos</h3></div>
                  <span className="shop-orders-count">{sellerProducts.length} publicados</span>
                </div>
                {editingProduct && (
                  <form className="checkout-address-form shop-seller-edit" onSubmit={handleUpdateProduct}>
                    <div className="shop-seller-edit-heading">
                      <h3>Editar {editingProduct.Nombre}</h3>
                      <button type="button" onClick={() => setEditingProduct(null)} aria-label="Cerrar edición"><FiX /></button>
                    </div>
                    <label>Categoría
                      <select value={editingProduct.CategoriaID} onChange={(event) => setEditingProduct({ ...editingProduct, CategoriaID: event.target.value })} required>
                        {categories.map((category) => (
                          <option key={category.CategoriaID} value={category.CategoriaID}>{category.Nombre}</option>
                        ))}
                      </select>
                    </label>
                    <label>Nombre<input value={editingProduct.Nombre} onChange={(event) => setEditingProduct({ ...editingProduct, Nombre: event.target.value })} required /></label>
                    <label>Descripción<input value={editingProduct.Descripcion || ''} onChange={(event) => setEditingProduct({ ...editingProduct, Descripcion: event.target.value })} /></label>
                    <label>Precio<input type="number" min="1" value={editingProduct.Precio} onChange={(event) => setEditingProduct({ ...editingProduct, Precio: event.target.value })} required /></label>
                    <button className="admin-action-button" disabled={busy} type="submit">Guardar cambios</button>
                    <div>
                      <label>Agregar existencias<input type="number" min="1" value={stockToAdd} onChange={(event) => setStockToAdd(event.target.value)} required /></label>
                      <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={handleAddStock} type="button">Agregar existencias</button>
                    </div>
                    <div>
                      <label>Agregar imagen
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => setNewProductImage(event.target.files?.[0] || null)}
                        />
                      </label>
                      <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={handleAddProductImage} type="button">Agregar imagen</button>
                    </div>
                    {productImages.map((image) => (
                      <div key={image.ImagenID ?? image.imagenid}>
                        <span>{(image.EsPrincipal ?? image.esprincipal) ? 'Principal' : 'Secundaria'}</span>
                        <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => handleSetMainImage(image.ImagenID ?? image.imagenid)} type="button">Principal</button>
                        <button className="admin-action-button" disabled={busy} onClick={() => handleDeleteProductImage(image.ImagenID ?? image.imagenid)} type="button">Eliminar</button>
                      </div>
                    ))}
                    <button className="admin-action-button admin-action-secondary" type="button" onClick={() => setEditingProduct(null)}>Cancelar</button>
                  </form>
                )}
                {sellerProducts.length === 0 ? (
                  <p>Aún no tienes productos.</p>
                ) : (
                  <div className="shop-seller-products">
                    {sellerProducts.map((product) => (
                      <article className="shop-seller-product-card" key={product.ProductoID}>
                        <div className="shop-seller-product-image">
                          {product.ImagenURL
                            ? <img alt={product.Nombre} src={resolveImageUrl(product.ImagenURL)} />
                            : <FiBox aria-hidden="true" />}
                          <span>{Number(product.CantidadDisponible || 0)} disponibles</span>
                        </div>
                        <div className="shop-seller-product-copy">
                          <h3>{product.Nombre}</h3>
                          <strong>₡{Number(product.Precio || 0).toLocaleString('es-CR')}</strong>
                        </div>
                        <div className="shop-seller-product-actions">
                          <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => openProductImages(product)} type="button">
                            <FiEdit3 />Editar
                          </button>
                          <button className="shop-seller-deactivate" disabled={busy} onClick={() => handleDeactivateProduct(product.ProductoID)} type="button">
                            Desactivar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="shop-seller-section-heading shop-seller-orders-heading">
                  <div><span className="shop-section-eyebrow">VENTAS</span><h3>Pedidos recibidos</h3></div>
                  <span className="shop-orders-count">{sellerOrders.length} pedidos</span>
                </div>
                {sellerOrders.length === 0 ? (
                  <p>Aún no tienes pedidos recibidos.</p>
                ) : (
                  <div className="shop-seller-orders">
                    {sellerOrders.map((order) => {
                      const isOpen = Boolean(openSellerOrderIds[order.PedidoID])
                      const details = orderDetails[order.PedidoID]
                      return (
                        <article className="shop-seller-order" key={order.PedidoID}>
                          <header>
                            <div><span>Pedido</span><h3>#{order.PedidoID}</h3></div>
                            <span className={`shop-order-status status-${String(order.Estado || '').toLowerCase().replace(/\s+/g, '-')}`}>{order.Estado}</span>
                          </header>
                          <div className="shop-seller-order-body">
                            <p><FiUser aria-hidden="true" /><span>{order.Comprador}</span></p>
                            <strong>₡{Number(order.SubtotalVendedor || 0).toLocaleString('es-CR')}</strong>
                            <button
                              className="admin-action-button admin-action-secondary"
                              disabled={busy}
                              aria-expanded={isOpen}
                              onClick={() => {
                                if (isOpen) {
                                  setOpenSellerOrderIds((current) => ({ ...current, [order.PedidoID]: false }))
                                } else if (details) {
                                  setOpenSellerOrderIds((current) => ({ ...current, [order.PedidoID]: true }))
                                } else {
                                  setOpenSellerOrderIds((current) => ({ ...current, [order.PedidoID]: true }))
                                  openOrderDetails(order.PedidoID)
                                }
                              }}
                              type="button"
                            >
                              <FiEye />{isOpen ? 'Ocultar detalles' : 'Ver detalles'}
                            </button>
                            {isOpen && details && (
                              <div className="shop-seller-order-details">
                                {details.details.map((detail, index) => {
                                  const product = details.products[index]
                                  return (
                                    <p key={detail.DetallePedidoID}>
                                      <span>{product?.Nombre || `Producto #${detail.ProductoID}`}</span>
                                      <strong>{detail.Cantidad} unidades</strong>
                                    </p>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        ) : view === 'checkout' ? (
          <section className="catalog-view shop-checkout-page" aria-labelledby="checkout-title">
            <div className="shop-orders-heading shop-checkout-heading">
              <div>
                <span className="shop-section-eyebrow">FINALIZA TU COMPRA</span>
                <h2 id="checkout-title">Checkout</h2>
              </div>
              <span className="shop-orders-count">{cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}</span>
            </div>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {message && <p className="dialog-notice" role="status">{message}</p>}

            <div className="shop-checkout-layout">
              <div className="shop-checkout-form">
                {checkoutStep === 'form' && (addresses.length === 0 ? (
                  <form className="checkout-address-form" onSubmit={handleCreateAddress}>
                    <h3>Agrega una dirección</h3>
                    <label>Provincia<input value={newAddress.provincia} onChange={(event) => setNewAddress({ ...newAddress, provincia: event.target.value })} required /></label>
                    <label>Cantón<input value={newAddress.canton} onChange={(event) => setNewAddress({ ...newAddress, canton: event.target.value })} required /></label>
                    <label>Distrito<input value={newAddress.distrito} onChange={(event) => setNewAddress({ ...newAddress, distrito: event.target.value })} required /></label>
                    <label>Señas<input value={newAddress.detalle} onChange={(event) => setNewAddress({ ...newAddress, detalle: event.target.value })} required /></label>
                    <button className="dialog-primary" disabled={busy} type="submit">
                      {busy ? 'Guardando...' : 'Guardar dirección'}
                    </button>
                  </form>
                ) : (
                  <label>
                    Dirección
                    <select value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)}>
                      <option value="">Selecciona una dirección</option>
                      {addresses.map((address) => (
                        <option key={address.DireccionID} value={address.DireccionID}>
                          {address.Detalle}, {address.Distrito}, {address.Canton}, {address.Provincia}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}

                {checkoutStep === 'form' && (
                  <>
                    <label>
                      Tipo de envío
                      <select value={selectedShippingTypeId} onChange={(event) => setSelectedShippingTypeId(event.target.value)}>
                        <option value="">Selecciona un tipo de envío</option>
                        {shippingTypes.map((type) => (
                          <option key={type.TipoEnvioID} value={type.TipoEnvioID}>
                            {type.Nombre} · ₡{Number(type.Costo || 0).toLocaleString('es-CR')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Método de pago
                      <select value={selectedPaymentMethodId} onChange={(event) => setSelectedPaymentMethodId(event.target.value)}>
                        <option value="">Selecciona un método de pago</option>
                        {paymentMethods.map((method) => (
                          <option key={method.MetodoPagoID} value={method.MetodoPagoID}>
                            {method.Nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {checkoutStep === 'form' ? (
                  <button
                    className="dialog-primary"
                    disabled={busy || !selectedAddressId || !selectedShippingTypeId || !selectedPaymentMethodId}
                    onClick={() => setCheckoutStep('review')}
                    type="button"
                  >
                    Revisar pedido
                  </button>
                ) : (
                  <div className="checkout-review">
                    <h3>Confirma los datos</h3>
                    {selectedAddress && <p><FiMapPin aria-hidden="true" /><span><strong>Entrega</strong>{selectedAddress.Detalle}, {selectedAddress.Distrito}, {selectedAddress.Canton}, {selectedAddress.Provincia}</span></p>}
                    {selectedShipping && <p><FiPackage aria-hidden="true" /><span><strong>Envío</strong>{selectedShipping.Nombre} · ₡{checkoutShippingCost.toLocaleString('es-CR')}</span></p>}
                    {selectedPaymentMethod && <p><FiCheck aria-hidden="true" /><span><strong>Pago</strong>{selectedPaymentMethod.Nombre}</span></p>}
                    <div className="checkout-review-actions">
                      <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => setCheckoutStep('form')} type="button">Editar datos</button>
                      <button className="dialog-primary" disabled={busy} onClick={handleCreateOrder} type="button">
                        {busy ? 'Creando pedido...' : 'Confirmar pedido'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="shop-checkout-summary">
                <div className="shop-checkout-summary-heading">
                  <h3>Resumen del pedido</h3>
                  <span>{cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}</span>
                </div>
                <div className="shop-checkout-products">
                  {cartItems.map((item) => {
                    const productoID = item.ProductoID ?? item.productoid
                    const nombre = item.Producto ?? item.producto ?? `Producto ${productoID}`
                    const cantidad = Number(item.Cantidad ?? item.cantidad ?? 1)
                    const subtotal = Number(item.Subtotal ?? item.subtotal ?? 0)
                    return (
                      <article key={productoID}>
                        <span className="shop-checkout-product-icon" aria-hidden="true"><FiShoppingBag /></span>
                        <div>
                          <strong>{nombre}</strong>
                          <span>Cantidad: {cantidad}</span>
                        </div>
                        <b>₡{subtotal.toLocaleString('es-CR')}</b>
                      </article>
                    )
                  })}
                </div>
                <div className="shop-checkout-totals">
                  <p><span>Subtotal</span><strong>₡{checkoutSubtotal.toLocaleString('es-CR')}</strong></p>
                  <p><span>Envío</span><strong>{checkoutShippingCost > 0 ? `₡${checkoutShippingCost.toLocaleString('es-CR')}` : 'Por calcular'}</strong></p>
                  <p className="shop-checkout-grand-total"><span>Total</span><strong>₡{(checkoutSubtotal + checkoutShippingCost).toLocaleString('es-CR')}</strong></p>
                </div>
              </aside>
            </div>
          </section>
        ) : view === 'orders' ? (
          <section className="catalog-view shop-orders-page" aria-labelledby="orders-title">
            <div className="shop-orders-heading">
              <div>
                <span className="shop-section-eyebrow">HISTORIAL DE COMPRAS</span>
                <h2 id="orders-title">Mis pedidos</h2>
              </div>
              {orders.length > 0 && (
                <span className="shop-orders-count">{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</span>
              )}
            </div>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {ordersLoading ? (
              <div className="shop-orders-grid" aria-label="Cargando pedidos">
                {[1, 2, 3].map((item) => (
                  <div className="shop-order-card shop-order-skeleton" key={item}>
                    <div className="shop-order-skeleton-line is-wide" />
                    <div className="shop-order-skeleton-line" />
                    <div className="shop-order-skeleton-line is-short" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="shop-empty-state shop-orders-empty">
                <span aria-hidden="true"><FiPackage /></span>
                <h3>Aún no tienes pedidos</h3>
                <p>Cuando realices una compra, aparecerá aquí el seguimiento completo.</p>
                <button className="dialog-primary" onClick={openFullCatalog} type="button">Explorar catálogo</button>
              </div>
            ) : (
              <div className="shop-orders-grid">
                {orders.map((order) => {
                  const orderStatus = order.Estado || 'Pendiente'
                  const statusClass = String(orderStatus).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
                  const details = orderDetails[order.PedidoID]
                  const isDetailsOpen = Boolean(openOrderDetailsIds[order.PedidoID])
                  return (
                    <article className="shop-order-card" key={order.PedidoID}>
                      <header className="shop-order-card-header">
                        <div>
                          <span>Pedido</span>
                          <h3>#{order.PedidoID}</h3>
                        </div>
                        <span className={`shop-order-status status-${statusClass}`}>{orderStatus}</span>
                      </header>
                      <div className="shop-order-card-body">
                        <div className="shop-order-total">
                          <span>Total pagado</span>
                          <strong>₡{Number(order.Total || 0).toLocaleString('es-CR')}</strong>
                        </div>
                        {isDetailsOpen && details && (
                          <div className="shop-order-meta">
                            <div>
                              <FiMapPin aria-hidden="true" />
                              <span>{details.address ? `${details.address.Distrito}, ${details.address.Canton}` : 'Dirección no disponible'}</span>
                            </div>
                            <div>
                              <FiPackage aria-hidden="true" />
                              <span>Envío: {details.shipping?.Estado || 'Sin envío'}</span>
                            </div>
                            <div>
                              <FiCheck aria-hidden="true" />
                              <span>Pago: {details.payments[0]?.Estado || 'Sin pago'}</span>
                            </div>
                          </div>
                        )}
                        <div className="shop-order-actions">
                          <button
                            aria-expanded={isDetailsOpen}
                            className="admin-action-button admin-action-secondary"
                            disabled={busy}
                            onClick={() => {
                              if (isDetailsOpen) {
                                setOpenOrderDetailsIds((current) => ({ ...current, [order.PedidoID]: false }))
                              } else if (details) {
                                setOpenOrderDetailsIds((current) => ({ ...current, [order.PedidoID]: true }))
                              } else {
                                setOpenOrderDetailsIds((current) => ({ ...current, [order.PedidoID]: true }))
                                openOrderDetails(order.PedidoID)
                              }
                            }}
                            type="button"
                          >
                            {isDetailsOpen ? 'Ocultar detalles' : 'Ver detalles'}
                            <FiArrowRight aria-hidden="true" />
                          </button>
                          {(user?.rol === 'Comprador' || user?.rol === 'Administrador') &&
                            !['Cancelado', 'Entregado'].includes(order.Estado) && (
                              <button className="shop-order-cancel" disabled={busy} onClick={() => handleCancelOrder(order.PedidoID)} type="button">
                                <FiX aria-hidden="true" />Cancelar
                              </button>
                            )}
                        </div>
                        {isDetailsOpen && details && (
                          <div className="shop-order-details">
                            {details.address && (
                              <p><strong>Entrega:</strong> {details.address.Detalle}, {details.address.Distrito}, {details.address.Canton}, {details.address.Provincia}</p>
                            )}
                            {details.details.map((detail, index) => {
                              const product = details.products[index]
                              return (
                                <p key={detail.DetallePedidoID}>
                                  <span>{product?.Nombre || `Producto #${detail.ProductoID}`}</span>
                                  <strong>{detail.Cantidad} × ₡{Number(detail.PrecioUnitario).toLocaleString('es-CR')}</strong>
                                </p>
                              )
                            })}
                          </div>
                        )}
                      </div>
                  </article>
                  )
                })}
              </div>
            )}
          </section>
        ) : view === 'cart' ? (
          <section className="catalog-view shop-cart-page" aria-labelledby="cart-title">
            <div className="shop-orders-heading shop-cart-heading">
              <div>
                <span className="shop-section-eyebrow">TU COMPRA</span>
                <h2 id="cart-title">Carrito</h2>
              </div>
              {cartItems.length > 0 && (
                <span className="shop-orders-count">{cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}</span>
              )}
            </div>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {cartLoading ? (
              <div className="shop-cart-layout" aria-label="Cargando carrito">
                <div className="shop-cart-lines">
                  {[1, 2].map((item) => <div className="shop-cart-skeleton" key={item} />)}
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="shop-empty-state shop-orders-empty">
                <span aria-hidden="true"><FiShoppingCart /></span>
                <h3>Tu carrito está vacío</h3>
                <p>Añade productos a tu carrito y vuelve aquí para completar tu compra.</p>
                <button className="dialog-primary" onClick={openFullCatalog} type="button">Explorar catálogo</button>
              </div>
            ) : (
              <div className="shop-cart-layout">
                <div className="shop-cart-lines">
                  {cartItems.map((item) => {
                    const productoID = item.ProductoID ?? item.productoid
                    const nombre = item.Producto ?? item.producto ?? `Producto ${productoID}`
                    const precio = Number(item.Precio ?? item.precio ?? 0)
                    const cantidad = Number(item.Cantidad ?? item.cantidad ?? 1)
                    const subtotal = Number(item.Subtotal ?? item.subtotal ?? precio * cantidad)
                    const stock = Number(item.CantidadDisponible ?? item.cantidaddisponible ?? 0)
                    return (
                      <article className="shop-cart-line" key={productoID}>
                        <div className="shop-cart-thumb" aria-hidden="true">
                          <FiShoppingBag />
                        </div>
                        <div className="shop-cart-product">
                          <h3>{nombre}</h3>
                          <span>₡{precio.toLocaleString('es-CR')} por unidad</span>
                          <small>{stock} disponibles</small>
                        </div>
                        <div className="shop-cart-quantity" aria-label={`Cantidad de ${nombre}`}>
                          <button
                            disabled={busy || cantidad <= 1}
                            onClick={() => handleUpdateCart(productoID, cantidad - 1)}
                            type="button"
                            aria-label="Reducir cantidad"
                          ><FiMinus /></button>
                          <strong>{cantidad}</strong>
                          <button
                            disabled={busy || cantidad >= stock}
                            onClick={() => handleUpdateCart(productoID, cantidad + 1)}
                            type="button"
                            aria-label="Aumentar cantidad"
                          ><FiPlus /></button>
                        </div>
                        <strong className="shop-cart-subtotal">₡{subtotal.toLocaleString('es-CR')}</strong>
                        <button className="shop-cart-remove" aria-label={`Eliminar ${nombre}`} disabled={busy} onClick={() => handleRemoveCartItem(productoID)} type="button">
                          <FiTrash2 />
                        </button>
                      </article>
                    )
                  })}
                </div>
                <aside className="shop-cart-summary">
                  <h3>Resumen</h3>
                  <div>
                    <span>Subtotal</span>
                    <strong>₡{cartItems.reduce((total, item) => {
                      const precio = Number(item.Precio ?? item.precio ?? 0)
                      const cantidad = Number(item.Cantidad ?? item.cantidad ?? 0)
                      return total + Number(item.Subtotal ?? item.subtotal ?? precio * cantidad)
                    }, 0).toLocaleString('es-CR')}</strong>
                  </div>
                  <div className="shop-cart-total">
                    <span>Total</span>
                    <strong>₡{cartItems.reduce((total, item) => {
                      const precio = Number(item.Precio ?? item.precio ?? 0)
                      const cantidad = Number(item.Cantidad ?? item.cantidad ?? 0)
                      return total + Number(item.Subtotal ?? item.subtotal ?? precio * cantidad)
                    }, 0).toLocaleString('es-CR')}</strong>
                  </div>
                  <button className="dialog-primary" disabled={busy} onClick={openCheckout} type="button">
                    Continuar con la compra <FiArrowRight />
                  </button>
                  <button className="shop-cart-clear" disabled={busy} onClick={handleClearCart} type="button">
                    <FiTrash2 />Vaciar carrito
                  </button>
                </aside>
              </div>
            )}
          </section>
        ) : view === 'home' ? (
          <section className="shop-catalog shop-home" aria-label="Inicio de ClickMarket">
            <section aria-labelledby="shop-hero-title" className="shop-hero">
              <div className="shop-hero-copy">
                <span className="shop-eyebrow">TU TIENDA EN LÍNEA EN COSTA RICA</span>
                <h1 id="shop-hero-title">Encuentra eso que buscas, <em>más fácil.</em></h1>
                <p>Explora productos de distintas categorías y encuentra todo para tu día a día en un solo lugar.</p>
                <button className="shop-hero-cta" onClick={openFullCatalog} type="button">
                  Explorar productos
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="M4 10h12m-5-5 5 5-5 5" />
                  </svg>
                </button>
                <div className="shop-hero-note">
                  <span aria-hidden="true">✓</span>
                  Compra sencilla, con precios en colones
                </div>
              </div>
              <div className="shop-hero-visual">
                <div className="shop-hero-orbit" aria-hidden="true" />
                <div className="shop-hero-product-image">
                  {products[0]?.ImagenURL ? (
                    <img alt={products[0].Nombre} src={resolveImageUrl(products[0].ImagenURL)} />
                  ) : (
                    <span aria-hidden="true">CM</span>
                  )}
                </div>
                {products[0] && (
                  <div className="shop-hero-product-card">
                    <span>Del catálogo</span>
                    <strong>{products[0].Nombre}</strong>
                    <b>₡{Number(products[0].Precio || 0).toLocaleString('es-CR')}</b>
                  </div>
                )}
              </div>
            </section>

            {error && <p className="dialog-error" role="alert">{error}</p>}

            <div className="shop-benefits">
              <article>
                <span aria-hidden="true">₡</span>
                <div><strong>Precios claros</strong><small>Consulta los precios en colones.</small></div>
              </article>
              <article>
                <span aria-hidden="true">⌕</span>
                <div><strong>Explora a tu manera</strong><small>Busca por nombre o categoría.</small></div>
              </article>
              <article>
                <span aria-hidden="true">✓</span>
                <div><strong>Compra simple</strong><small>Carrito y pedidos en un solo lugar.</small></div>
              </article>
            </div>

            {shopCategories.length > 0 && (
              <section aria-labelledby="shop-categories-title" className="shop-categories" id="shop-categories">
                <div className="shop-section-heading">
                  <div>
                    <span className="shop-section-eyebrow">ENCUENTRA LO QUE NECESITAS</span>
                    <h2 id="shop-categories-title">Explora por categoría</h2>
                  </div>
                  <span className="shop-section-caption">{shopCategories.length} categorías</span>
                </div>
                <div className="shop-category-grid">
                  {shopCategories.map((category, index) => {
                    const id = String(category.CategoriaID)
                    const CategoryIcon = getCategoryIcon(category.Nombre)
                    const productCount = products.filter((product) =>
                      String(product.CategoriaID ?? product.categoriaid) === id
                    ).length
                    return (
                      <button
                        aria-pressed={categoryId === id}
                        className={`shop-category-card shop-category-tone-${index % 6}${categoryId === id ? ' is-selected' : ''}`}
                        key={category.CategoriaID}
                        onClick={() => browseCategory(id)}
                        type="button"
                      >
                        <span aria-hidden="true" className="shop-category-icon">
                          <CategoryIcon />
                        </span>
                        <div className="shop-category-copy">
                          <strong>{category.Nombre}</strong>
                          <small>{productCount} {productCount === 1 ? 'producto' : 'productos'}</small>
                        </div>
                        <FiArrowRight aria-hidden="true" className="shop-category-arrow" />
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <section aria-labelledby="home-featured-title" className="shop-products-section" id="home-featured-products">
              <div className="shop-products-heading">
                <div>
                  <span className="shop-section-eyebrow">UNA SELECCIÓN PARA EMPEZAR</span>
                  <h2 id="home-featured-title">Productos destacados</h2>
                  <p>Algunos artículos disponibles para descubrir.</p>
                </div>
                <button className="shop-view-all" onClick={openFullCatalog} type="button">
                  Ver catálogo completo
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="M4 10h12m-5-5 5 5-5 5" />
                  </svg>
                </button>
              </div>

              {catalogLoading ? (
                <p className="shop-loading" role="status">Cargando productos...</p>
              ) : products.length === 0 ? (
                <div className="shop-empty-state">
                  <p>No hay productos disponibles en este momento.</p>
                </div>
              ) : (
                renderProductCards(products.slice(0, 4))
              )}
            </section>
          </section>
        ) : view === 'search' ? (
          <section className="catalog-view shop-catalog shop-search-page">
            <div className="shop-search-heading" id="search-page-title">
              <div>
                <span className="shop-section-eyebrow">
                  {search.trim() ? 'BÚSQUEDA DE PRODUCTOS' : 'CATÁLOGO CLICKMARKET'}
                </span>
                <h1>
                  {search.trim()
                    ? `Resultados para “${search.trim()}”`
                    : categoryDetail?.Nombre
                      ? `Productos de ${categoryDetail.Nombre}`
                      : 'Explora el catálogo'}
                </h1>
                <p>
                  {search.trim()
                    ? 'Revisa los resultados y ajusta la categoría si lo necesitas.'
                    : 'Busca entre todos los productos disponibles y filtra por categoría.'}
                </p>
              </div>
              <button className="shop-back-home" onClick={returnHome} type="button">
                Volver al inicio
              </button>
            </div>

            {error && <p className="dialog-error" role="alert">{error}</p>}

            <div className="shop-search-layout">
              <aside aria-labelledby="search-filter-title" className="shop-search-sidebar" id="catalog-filters">
                <h2 id="search-filter-title">Categorías</h2>
                <button
                  aria-pressed={!categoryId}
                  className={!categoryId ? 'is-selected' : ''}
                  onClick={() => browseCategory('')}
                  type="button"
                >
                  Todas las categorías
                </button>
                {shopCategories.map((category) => {
                  const id = String(category.CategoriaID)
                  return (
                    <button
                      aria-pressed={categoryId === id}
                      className={categoryId === id ? 'is-selected' : ''}
                      key={category.CategoriaID}
                      onClick={() => browseCategory(id)}
                      type="button"
                    >
                      {category.Nombre}
                    </button>
                  )
                })}
                {(search.trim() || categoryId) && (
                  <button className="shop-reset-filters" onClick={openFullCatalog} type="button">
                    Limpiar filtros
                  </button>
                )}
              </aside>

              <section aria-label="Resultados del catálogo" className="shop-search-results" id="catalog-products">
                <div className="shop-search-toolbar">
                  <span>
                    {catalogLoading
                      ? 'Buscando productos...'
                      : `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`}
                  </span>
                  {categoryDetail?.Descripcion && <span>{categoryDetail.Descripcion}</span>}
                </div>

                {selectedProductDetail && (
                  <div className="catalog-card shop-product-detail">
                    <h2>{selectedProductDetail.product.Nombre}</h2>
                    <p>{selectedProductDetail.product.Descripcion || 'Sin descripción'}</p>
                    <strong>₡{Number(selectedProductDetail.product.Precio || 0).toLocaleString('es-CR')}</strong>
                    <p>Existencias: {Number(selectedProductDetail.inventory?.CantidadDisponible ?? selectedProductDetail.inventory?.cantidaddisponible ?? 0)}</p>
                    {selectedProductDetail.images.length > 0 && (
                      <div className="product-detail-images">
                        {selectedProductDetail.images.map((image) => (
                          <div className={`product-detail-image${image.EsPrincipal ?? image.esprincipal ? ' is-main' : ''}`} key={image.ImagenID ?? image.imagenid}>
                            <img alt={(image.EsPrincipal ?? image.esprincipal) ? `Imagen principal de ${selectedProductDetail.product.Nombre}` : `${selectedProductDetail.product.Nombre}`} src={resolveImageUrl(image.ImagenURL ?? image.imagenurl)} />
                            {(image.EsPrincipal ?? image.esprincipal) && <span>Portada</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="admin-action-button admin-action-secondary" type="button" onClick={() => setSelectedProductDetail(null)}>Cerrar detalle</button>
                  </div>
                )}

                {catalogLoading ? (
                  <p className="shop-loading" role="status">Cargando productos...</p>
                ) : products.length === 0 ? (
                  <div className="shop-empty-state">
                    <span aria-hidden="true">⌕</span>
                    <h2>No encontramos productos</h2>
                    <p>Prueba con otra búsqueda o explora todas las categorías.</p>
                    <button className="admin-action-button admin-action-secondary" onClick={openFullCatalog} type="button">
                      Ver catálogo completo
                    </button>
                  </div>
                ) : (
                  renderProductCards(products)
                )}
              </section>
            </div>
          </section>
        ) : (
          <section className={user ? 'app-dialog account-dialog' : 'app-dialog'} aria-labelledby="auth-title">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">CLICKMARKET</span>
              <h2 id="auth-title">{user ? 'Tu cuenta' : mode === 'login' ? 'Te damos la bienvenida' : 'Crea tu cuenta'}</h2>
              {user && <p className="account-heading-copy">Gestiona tus datos y tus opciones de entrega desde un solo lugar.</p>}
            </div>
          </div>

          {error && <p className="dialog-error" role="alert">{error}</p>}
          {message && <p className="dialog-notice" role="status">{message}</p>}

          {user ? (
            <div className="account-summary">
              <div className="account-profile-heading">
                <div className="account-avatar" aria-hidden="true">{user.nombre?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div className="account-identity">
                  <strong>{user.nombre} {user.apellido}</strong>
                  <span>{user.correo}</span>
                  <span className="account-role">{user.rol}</span>
                </div>
              </div>
              <form className="auth-form" onSubmit={handleUpdateProfile}>
                <h3><FiUser aria-hidden="true" />Información personal</h3>
                <label><span>Nombre</span><input value={profileEdit.nombre} onChange={(event) => setProfileEdit({ ...profileEdit, nombre: event.target.value })} required /></label>
                <label><span>Apellido</span><input value={profileEdit.apellido} onChange={(event) => setProfileEdit({ ...profileEdit, apellido: event.target.value })} required /></label>
                <label><span>Correo <FiMail aria-hidden="true" /></span><input type="email" value={profileEdit.correo} onChange={(event) => setProfileEdit({ ...profileEdit, correo: event.target.value })} required /></label>
                <button className="dialog-primary" disabled={busy} type="submit"><FiSave aria-hidden="true" />Guardar perfil</button>
              </form>
              <section className="account-addresses" aria-labelledby="account-addresses-title">
                <div className="account-address-heading">
                  <div>
                    <h3 id="account-addresses-title"><FiMapPin aria-hidden="true" />Mis direcciones</h3>
                    <p>Administra dónde quieres recibir tus compras.</p>
                  </div>
                  <button
                    aria-controls="add-address-form"
                    aria-expanded={addingAddress}
                    className="admin-action-button admin-action-secondary"
                    type="button"
                    onClick={() => setAddingAddress((current) => !current)}
                  >
                    {addingAddress ? <><FiX aria-hidden="true" />Cancelar</> : <><FiPlus aria-hidden="true" />Agregar dirección</>}
                  </button>
                </div>
                {addingAddress && (
                  <form
                    aria-label="Agregar dirección"
                    className="auth-form account-address-form"
                    id="add-address-form"
                    onSubmit={handleCreateAddress}
                  >
                    <h3><FiPlus aria-hidden="true" />Nueva dirección</h3>
                    <label>Provincia<input value={newAddress.provincia} onChange={(event) => setNewAddress({ ...newAddress, provincia: event.target.value })} required /></label>
                    <label>Cantón<input value={newAddress.canton} onChange={(event) => setNewAddress({ ...newAddress, canton: event.target.value })} required /></label>
                    <label>Distrito<input value={newAddress.distrito} onChange={(event) => setNewAddress({ ...newAddress, distrito: event.target.value })} required /></label>
                    <label>Señas<input value={newAddress.detalle} onChange={(event) => setNewAddress({ ...newAddress, detalle: event.target.value })} required /></label>
                    <button className="dialog-primary" disabled={busy} type="submit">{busy ? 'Guardando...' : 'Guardar dirección'}</button>
                  </form>
                )}
                {addresses.length > 0 ? (
                  <div className="catalog-grid">
                    {addresses.map((address) => (
                      <article className="catalog-card account-address-card" key={address.DireccionID}>
                      {editingAddress?.DireccionID === address.DireccionID ? (
                        <form onSubmit={handleUpdateAddress}>
                          <label>Provincia<input value={editingAddress.Provincia} onChange={(event) => setEditingAddress({ ...editingAddress, Provincia: event.target.value })} required /></label>
                          <label>Cantón<input value={editingAddress.Canton} onChange={(event) => setEditingAddress({ ...editingAddress, Canton: event.target.value })} required /></label>
                          <label>Distrito<input value={editingAddress.Distrito} onChange={(event) => setEditingAddress({ ...editingAddress, Distrito: event.target.value })} required /></label>
                          <label>Señas<input value={editingAddress.Detalle} onChange={(event) => setEditingAddress({ ...editingAddress, Detalle: event.target.value })} required /></label>
                          <div className="account-address-actions">
                            <button className="admin-action-button" type="submit"><FiSave aria-hidden="true" />Guardar</button>
                            <button className="admin-action-button admin-action-secondary" type="button" onClick={() => setEditingAddress(null)}><FiX aria-hidden="true" />Cancelar</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h3>{address.Principal ? 'Dirección principal' : 'Dirección'}</h3>
                          <p>{address.Detalle}, {address.Distrito}, {address.Canton}, {address.Provincia}</p>
                          <div className="account-address-actions">
                            <button className="admin-action-button admin-action-secondary" type="button" onClick={() => setEditingAddress(address)}><FiEdit3 aria-hidden="true" />Editar</button>
                            {!address.Principal && (
                              <button className="admin-action-button" type="button" onClick={() => handleSetMainAddress(address.DireccionID)}><FiCheck aria-hidden="true" />Usar como principal</button>
                            )}
                            <button className="admin-action-button account-delete-action" type="button" onClick={() => handleDeleteAddress(address.DireccionID)}><FiTrash2 aria-hidden="true" />Eliminar</button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                  </div>
                ) : !addingAddress && (
                  <p className="account-empty-addresses">Aún no tienes direcciones guardadas.</p>
                )}
              </section>
              <button className="dialog-primary account-logout" type="button" onClick={handleLogout} disabled={busy}>
                <FiLogOut aria-hidden="true" />{busy ? 'Cerrando...' : 'Cerrar sesión'}
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="auth-name-fields">
                  <label>Nombre<input name="nombre" required /></label>
                  <label>Apellido<input name="apellido" required /></label>
                </div>
              )}
              <label>
                Correo
                <input name="correo" type="email" required />
              </label>
              <label>
                Contraseña
                <input name="contrasena" type="password" required />
              </label>
              <button className="dialog-primary" type="submit" disabled={busy}>
                {busy
                  ? 'Procesando...'
                  : mode === 'register'
                    ? 'Crear cuenta'
                    : 'Iniciar sesión'}
              </button>
              <p className="auth-switch">
                {mode === 'login' ? '¿Aún no tienes cuenta? ' : '¿Ya tienes una cuenta? '}
                <button type="button" onClick={() => {
                  setError('')
                  setMessage('')
                  setMode(mode === 'login' ? 'register' : 'login')
                }}>
                  {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
                </button>
              </p>
            </form>
          )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
