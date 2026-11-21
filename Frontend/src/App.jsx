import { useEffect, useState } from 'react'
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
  getCategory,
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

function App() {
  const [sessionLoading, setSessionLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState('catalog')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
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
  const [seller, setSeller] = useState(null)
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerOrders, setSellerOrders] = useState([])
  const [adminOrders, setAdminOrders] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedPaymentIds, setSelectedPaymentIds] = useState({})
  const [shippingStates, setShippingStates] = useState({})
  const [notifications, setNotifications] = useState([])
  const [orderDetails, setOrderDetails] = useState({})
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
  const [newImageURL, setNewImageURL] = useState('')
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

  async function filterProducts(event) {
    event?.preventDefault()
    setCatalogLoading(true)
    setError('')
    try {
      setProducts(await getProducts({
        categoryId: categoryId || undefined,
        search
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCatalogLoading(false)
    }
  }

  async function handleCategoryChange(categoryId) {
    setCategoryId(categoryId)
    setCategoryDetail(null)
    if (!categoryId) return
    try {
      setCategoryDetail(await getCategory(categoryId))
    } catch (requestError) {
      setError(requestError.message)
    }
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
      setOrders(await getOrders())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openOrders() {
    setView('orders')
    setBusy(true)
    setError('')
    try {
      setOrders(await getOrders())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openOrderDetails(orderId) {
    setBusy(true)
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
      setError(requestError.message)
    } finally {
      setBusy(false)
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
      setMessage(`Pedido #${orderId} cancelado.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openProductDetail(productId) {
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
      setView('catalog')
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
    if (!editingProduct || !newImageURL.trim()) {
      setError('Ingresa la URL de la imagen.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await addProductImage(editingProduct.ProductoID, {
        imagenURL: newImageURL.trim(),
        esPrincipal: productImages.length === 0,
        orden: productImages.length
      })
      setProductImages(await getProductImages(editingProduct.ProductoID))
      setNewImageURL('')
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
      setView('catalog')
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
      setMessage(`Pago #${paymentId} aprobado.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRejectPayment(paymentId) {
    setBusy(true)
    setError('')
    try {
      await rejectPayment(paymentId)
      setAdminOrders(await getAdminOrders())
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

  if (sessionLoading) {
    return (
      <div className="storefront">
        <main><section className="app-dialog"><p>Cargando sesión...</p></section></main>
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
          <form className="search-form" onSubmit={filterProducts}>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tu próximo producto está aquí"
              value={search}
            />
            <button type="submit">Buscar</button>
          </form>
          <div className="header-actions">
            {user && <button className="header-link" type="button">
              <span>{user.nombre}</span>
            </button>}
            {user && (
              <button className="header-link" type="button" onClick={() => setView('cart')}>
                Carrito ({cartItems.reduce((total, item) => total + Number(item.Cantidad ?? item.cantidad ?? 0), 0)})
              </button>
            )}
            {user && (
              <button className="header-link" type="button" onClick={openOrders}>
                Mis pedidos
              </button>
            )}
            {user && (
              <button className="header-link" type="button" onClick={openNotifications}>
                Notificaciones ({notifications.filter((notification) =>
                  ![true, 1, '1', 'true'].includes(notification.Leida ?? notification.leida)
                ).length})
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
              {user ? 'Mi cuenta' : 'Iniciar sesión'}
            </button>
          </div>
        </div>
      </header>

      <main>
        {view === 'notifications' ? (
          <section className="catalog-view" aria-labelledby="notifications-title">
            <h2 id="notifications-title">Notificaciones</h2>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {message && <p className="dialog-notice" role="status">{message}</p>}
            {notifications.length > 0 && (
              <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={handleMarkAllNotificationsRead} type="button">
                Marcar todas como leídas
              </button>
            )}
            {selectedNotification && (
              <div className="catalog-card">
                <h3>{selectedNotification.Titulo ?? selectedNotification.titulo}</h3>
                <p>{selectedNotification.Mensaje ?? selectedNotification.mensaje}</p>
              </div>
            )}
            {busy ? (
              <p>Cargando notificaciones...</p>
            ) : notifications.length === 0 ? (
              <p>No tienes notificaciones.</p>
            ) : (
              <div className="catalog-grid">
                {notifications.map((notification) => {
                  const notificationId = notification.NotificacionID ?? notification.notificacionid
                  const isRead = [true, 1, '1', 'true'].includes(notification.Leida ?? notification.leida)
                  return (
                    <article className="catalog-card" key={notificationId}>
                      <h3>{notification.Titulo ?? notification.titulo}</h3>
                      <p>{notification.Mensaje ?? notification.mensaje}</p>
                      <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => openNotification(notificationId)} type="button">
                        Ver detalle
                      </button>
                      {!isRead && (
                        <button className="admin-action-button" disabled={busy} onClick={() => handleMarkNotificationRead(notificationId)} type="button">
                          Marcar como leída
                        </button>
                      )}
                    </article>
                  )
                })}
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
                          <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => loadOrderPayments(order.PedidoID)} type="button">Cargar pagos</button>
                          <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => openOrderDetails(order.PedidoID)} type="button">Ver detalles</button>
                          {!['Cancelado', 'Entregado'].includes(order.Estado) && (
                            <button className="admin-action-button" disabled={busy} onClick={() => handleCancelOrder(order.PedidoID)} type="button">Cancelar pedido</button>
                          )}
                          {shippingState !== 'Entregado' && shippingState != null && (
                            <button className="admin-action-button" disabled={busy} onClick={() => handleUpdateShipping(order.PedidoID)} type="button">{nextShippingLabel}</button>
                          )}
                        </div>
                        {payments.map((payment) => (
                          <div className="admin-payment" key={payment.PagoID}>
                            <p>Pago #{payment.PagoID}</p>
                            <span className="admin-payment-status">{payment.Estado}</span>
                            {payment.Estado === 'Pendiente' && (
                              <div className="admin-payment-actions">
                                <button className="admin-action-button" disabled={busy} onClick={() => handleApprovePayment(order.PedidoID, payment.PagoID)} type="button">Aprobar</button>
                                <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => handleRejectPayment(payment.PagoID)} type="button">Rechazar</button>
                              </div>
                            )}
                          </div>
                        ))}
                        {selectedPaymentIds[order.PedidoID] && payments.length === 0 && (
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
          <section className="catalog-view" aria-labelledby="seller-title">
            <h2 id="seller-title">Mi tienda</h2>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {message && <p className="dialog-notice" role="status">{message}</p>}

            {!seller ? (
              <form className="checkout-address-form" onSubmit={handleCreateSeller}>
                <h3>Crear perfil de vendedor</h3>
                <label>Nombre comercial<input value={sellerForm.nombreComercial} onChange={(event) => setSellerForm({ ...sellerForm, nombreComercial: event.target.value })} required /></label>
                <label>Descripción<input value={sellerForm.descripcion} onChange={(event) => setSellerForm({ ...sellerForm, descripcion: event.target.value })} /></label>
                <button className="dialog-primary" disabled={busy} type="submit">
                  {busy ? 'Guardando...' : 'Crear perfil'}
                </button>
              </form>
            ) : (
              <>
                <h3>{seller.NombreComercial}</h3>
                <p>{seller.Descripcion || 'Sin descripción'}</p>
                <form className="checkout-address-form" onSubmit={handleUpdateSeller}>
                  <h3>Editar perfil de tienda</h3>
                  <label>Nombre comercial<input value={sellerEdit.nombreComercial} onChange={(event) => setSellerEdit({ ...sellerEdit, nombreComercial: event.target.value })} required /></label>
                  <label>Descripción<input value={sellerEdit.descripcion} onChange={(event) => setSellerEdit({ ...sellerEdit, descripcion: event.target.value })} /></label>
                  <button className="admin-action-button" disabled={busy} type="submit">Guardar perfil</button>
                </form>

                <form className="checkout-address-form" onSubmit={handlePublishProduct}>
                  <h3>Publicar producto</h3>
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

                <h3>Mis productos</h3>
                {editingProduct && (
                  <form className="checkout-address-form" onSubmit={handleUpdateProduct}>
                    <h3>Editar {editingProduct.Nombre}</h3>
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
                      <label>URL de imagen<input type="url" value={newImageURL} onChange={(event) => setNewImageURL(event.target.value)} /></label>
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
                  <div className="catalog-grid">
                    {sellerProducts.map((product) => (
                      <article className="catalog-card" key={product.ProductoID}>
                        {product.ImagenURL && <img alt={product.Nombre} src={resolveImageUrl(product.ImagenURL)} />}
                        <h3>{product.Nombre}</h3>
                        <strong>₡{Number(product.Precio || 0).toLocaleString('es-CR')}</strong>
                        <span>Existencias: {Number(product.CantidadDisponible || 0)}</span>
                        <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => openProductImages(product)} type="button">
                          Editar
                        </button>
                        <button className="dialog-primary" disabled={busy} onClick={() => handleDeactivateProduct(product.ProductoID)} type="button">
                          Desactivar
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                <h3>Pedidos recibidos</h3>
                {sellerOrders.length === 0 ? (
                  <p>Aún no tienes pedidos recibidos.</p>
                ) : (
                  <div className="catalog-grid">
                    {sellerOrders.map((order) => (
                      <article className="catalog-card" key={order.PedidoID}>
                        <h3>Pedido #{order.PedidoID}</h3>
                        <p>Comprador: {order.Comprador}</p>
                        <p>Estado: {order.Estado}</p>
                        <strong>Ingreso: ₡{Number(order.SubtotalVendedor || 0).toLocaleString('es-CR')}</strong>
                        <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => openOrderDetails(order.PedidoID)} type="button">
                          Ver detalles
                        </button>
                        {orderDetails[order.PedidoID] && (
                          <div className="admin-payment">
                            {orderDetails[order.PedidoID].details.map((detail, index) => {
                              const product = orderDetails[order.PedidoID].products[index]
                              return (
                                <p key={detail.DetallePedidoID}>
                                  {product?.Nombre || `Producto #${detail.ProductoID}`} · {detail.Cantidad} unidades
                                </p>
                              )
                            })}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        ) : view === 'checkout' ? (
          <section className="catalog-view" aria-labelledby="checkout-title">
            <h2 id="checkout-title">Checkout</h2>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {message && <p className="dialog-notice" role="status">{message}</p>}

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

            {checkoutStep === 'form' && <label>
              Tipo de envío
              <select value={selectedShippingTypeId} onChange={(event) => setSelectedShippingTypeId(event.target.value)}>
                <option value="">Selecciona un tipo de envío</option>
                {shippingTypes.map((type) => (
                  <option key={type.TipoEnvioID} value={type.TipoEnvioID}>
                    {type.Nombre} · ₡{Number(type.Costo || 0).toLocaleString('es-CR')}
                  </option>
                ))}
              </select>
            </label>}

            {checkoutStep === 'form' && <label>
              Método de pago
              <select value={selectedPaymentMethodId} onChange={(event) => setSelectedPaymentMethodId(event.target.value)}>
                <option value="">Selecciona un método de pago</option>
                {paymentMethods.map((method) => (
                  <option key={method.MetodoPagoID} value={method.MetodoPagoID}>
                    {method.Nombre}
                  </option>
                ))}
              </select>
            </label>}

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
                <h3>Resumen del pedido</h3>
                <div className="catalog-grid">
                  {cartItems.map((item) => (
                    <article className="catalog-card" key={item.ProductoID ?? item.productoid}>
                      <h4>{item.Producto ?? item.producto}</h4>
                      <p>Cantidad: {item.Cantidad ?? item.cantidad}</p>
                      <strong>₡{Number((item.Subtotal ?? item.subtotal) || 0).toLocaleString('es-CR')}</strong>
                    </article>
                  ))}
                </div>
                {selectedAddress && (
                  <p><strong>Entrega:</strong> {selectedAddress.Detalle}, {selectedAddress.Distrito}, {selectedAddress.Canton}, {selectedAddress.Provincia}</p>
                )}
                {selectedShipping && (
                  <p><strong>Envío:</strong> {selectedShipping.Nombre} · ₡{checkoutShippingCost.toLocaleString('es-CR')}</p>
                )}
                {selectedPaymentMethod && (
                  <p><strong>Método de pago:</strong> {selectedPaymentMethod.Nombre}</p>
                )}
                <p><strong>Subtotal:</strong> ₡{checkoutSubtotal.toLocaleString('es-CR')}</p>
                <p><strong>Total:</strong> ₡{(checkoutSubtotal + checkoutShippingCost).toLocaleString('es-CR')}</p>
                <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => setCheckoutStep('form')} type="button">Editar datos</button>
                <button
                  className="dialog-primary"
                  disabled={busy}
                  onClick={handleCreateOrder}
                  type="button"
                >
                  {busy ? 'Creando pedido...' : 'Confirmar pedido'}
                </button>
              </div>
            )}
          </section>
        ) : view === 'orders' ? (
          <section className="catalog-view" aria-labelledby="orders-title">
            <h2 id="orders-title">Mis pedidos</h2>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {busy ? (
              <p>Cargando pedidos...</p>
            ) : orders.length === 0 ? (
              <p>Aún no tienes pedidos.</p>
            ) : (
              <div className="catalog-grid">
                {orders.map((order) => (
                  <article className="catalog-card" key={order.PedidoID}>
                    <h3>Pedido #{order.PedidoID}</h3>
                    <p>Estado: {order.Estado || 'Pendiente'}</p>
                    <strong>₡{Number(order.Total || 0).toLocaleString('es-CR')}</strong>
                    <button className="admin-action-button admin-action-secondary" disabled={busy} onClick={() => openOrderDetails(order.PedidoID)} type="button">
                      Ver detalles
                    </button>
                    {(user?.rol === 'Comprador' || user?.rol === 'Administrador') &&
                      !['Cancelado', 'Entregado'].includes(order.Estado) && (
                        <button className="admin-action-button" disabled={busy} onClick={() => handleCancelOrder(order.PedidoID)} type="button">
                          Cancelar pedido
                        </button>
                      )}
                    {orderDetails[order.PedidoID] && (
                      <div className="admin-payment">
                        {orderDetails[order.PedidoID].address ? (
                          <p>
                            Entrega: {orderDetails[order.PedidoID].address.Detalle}, {orderDetails[order.PedidoID].address.Distrito}, {orderDetails[order.PedidoID].address.Canton}, {orderDetails[order.PedidoID].address.Provincia}
                          </p>
                        ) : (
                          <p>Dirección: no disponible</p>
                        )}
                        <p>Pago: {orderDetails[order.PedidoID].payments[0]?.Estado || 'Sin pago'}</p>
                        <p>Envío: {orderDetails[order.PedidoID].shipping?.Estado || 'Sin envío'}</p>
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
                ))}
              </div>
            )}
          </section>
        ) : view === 'cart' ? (
          <section className="catalog-view" aria-labelledby="cart-title">
            <h2 id="cart-title">Carrito</h2>
            {error && <p className="dialog-error" role="alert">{error}</p>}
            {cartLoading ? (
              <p>Cargando carrito...</p>
            ) : cartItems.length === 0 ? (
              <p>Tu carrito está vacío.</p>
            ) : (
              <>
                <div className="catalog-grid">
                  {cartItems.map((item) => {
                    const productoID = item.ProductoID ?? item.productoid
                    const nombre = item.Producto ?? item.producto ?? `Producto ${productoID}`
                    const precio = Number(item.Precio ?? item.precio ?? 0)
                    const cantidad = Number(item.Cantidad ?? item.cantidad ?? 1)
                    const subtotal = Number(item.Subtotal ?? item.subtotal ?? precio * cantidad)
                    const stock = Number(item.CantidadDisponible ?? item.cantidaddisponible ?? 0)
                    return (
                      <article className="catalog-card" key={productoID}>
                        <h3>{nombre}</h3>
                        <strong>₡{subtotal.toLocaleString('es-CR')}</strong>
                        <span>Existencias: {stock}</span>
                        <div>
                          <button
                            className="dialog-primary"
                            disabled={busy || cantidad <= 1}
                            onClick={() => handleUpdateCart(productoID, cantidad - 1)}
                            type="button"
                          >-</button>
                          <span> {cantidad} </span>
                          <button
                            className="dialog-primary"
                            disabled={busy || cantidad >= stock}
                            onClick={() => handleUpdateCart(productoID, cantidad + 1)}
                            type="button"
                          >+</button>
                        </div>
                        <button
                          className="dialog-primary"
                          disabled={busy}
                          onClick={() => handleRemoveCartItem(productoID)}
                          type="button"
                        >Eliminar</button>
                      </article>
                    )
                  })}
                </div>
                <p>
                  <strong>
                    Total: ₡{cartItems.reduce((total, item) => {
                      const precio = Number(item.Precio ?? item.precio ?? 0)
                      const cantidad = Number(item.Cantidad ?? item.cantidad ?? 0)
                      return total + Number(item.Subtotal ?? item.subtotal ?? precio * cantidad)
                    }, 0).toLocaleString('es-CR')}
                  </strong>
                </p>
                <button className="dialog-primary" disabled={busy} onClick={handleClearCart} type="button">
                  Vaciar carrito
                </button>
                <button className="dialog-primary" disabled={busy} onClick={openCheckout} type="button">
                  Continuar con la compra
                </button>
              </>
            )}
          </section>
        ) : view === 'catalog' ? (
          <section className="catalog-view" aria-labelledby="catalog-title">
            <h2 id="catalog-title">Catálogo</h2>

            {error && <p className="dialog-error" role="alert">{error}</p>}

            <form className="catalog-filter" onSubmit={filterProducts}>
              <label>
                Categoría
                <select
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  value={categoryId}
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.CategoriaID} value={category.CategoriaID}>
                      {category.Nombre}
                    </option>
                  ))}
                </select>
              </label>
              <button className="dialog-primary" type="submit" disabled={catalogLoading}>
                {catalogLoading ? 'Cargando...' : 'Aplicar filtro'}
              </button>
            </form>

            {categoryDetail && (
              <div className="catalog-card">
                <h3>{categoryDetail.Nombre}</h3>
                <p>{categoryDetail.Descripcion || 'Sin descripción'}</p>
              </div>
            )}

            {catalogLoading ? (
              <p>Cargando productos...</p>
            ) : products.length === 0 ? (
              <p>No hay productos disponibles.</p>
            ) : (
              <>
                {selectedProductDetail && (
                  <div className="catalog-card">
                    <h3>{selectedProductDetail.product.Nombre}</h3>
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
              <div className="catalog-grid">
                {products.map((product) => (
                  <article className="catalog-card" key={product.ProductoID}>
                    {product.ImagenURL && (
                      <img alt={product.Nombre} src={resolveImageUrl(product.ImagenURL)} />
                    )}
                    <h3>{product.Nombre}</h3>
                    <p>{product.Descripcion || 'Sin descripción'}</p>
                    <strong>₡{Number(product.Precio || 0).toLocaleString('es-CR')}</strong>
                    <span>Existencias: {Number(product.CantidadDisponible || 0)}</span>
                    <button
                      className="admin-action-button admin-action-secondary"
                      disabled={busy}
                      onClick={() => openProductDetail(product.ProductoID)}
                      type="button"
                    >
                      Ver detalle
                    </button>
                    <button
                      className="dialog-primary"
                      disabled={busy || Number(product.CantidadDisponible || 0) < 1}
                      onClick={() => handleAddToCart(product.ProductoID)}
                      type="button"
                    >
                      Agregar al carrito
                    </button>
                  </article>
                ))}
              </div>
              </>
            )}
          </section>
        ) : (
          <section className="app-dialog" aria-labelledby="auth-title">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">CLICKMARKET</span>
              <h2 id="auth-title">{user ? 'Tu cuenta' : mode === 'login' ? 'Te damos la bienvenida' : 'Crea tu cuenta'}</h2>
            </div>
          </div>

          {error && <p className="dialog-error" role="alert">{error}</p>}
          {message && <p className="dialog-notice" role="status">{message}</p>}

          {user ? (
            <div className="account-summary">
              <div className="account-avatar" aria-hidden="true">{user.nombre?.charAt(0)?.toUpperCase() || 'U'}</div>
              <strong>{user.nombre} {user.apellido}</strong>
              <span>{user.correo}</span>
              <span>{user.rol}</span>
              <form className="auth-form" onSubmit={handleUpdateProfile}>
                <label>Nombre<input value={profileEdit.nombre} onChange={(event) => setProfileEdit({ ...profileEdit, nombre: event.target.value })} required /></label>
                <label>Apellido<input value={profileEdit.apellido} onChange={(event) => setProfileEdit({ ...profileEdit, apellido: event.target.value })} required /></label>
                <label>Correo<input type="email" value={profileEdit.correo} onChange={(event) => setProfileEdit({ ...profileEdit, correo: event.target.value })} required /></label>
                <button className="dialog-primary" disabled={busy} type="submit">Guardar perfil</button>
              </form>
              <button className="admin-action-button admin-action-secondary" type="button" onClick={() => setAddingAddress((current) => !current)}>
                {addingAddress ? 'Cancelar' : 'Agregar dirección'}
              </button>
              {addingAddress && (
                <form className="auth-form" onSubmit={handleCreateAddress}>
                  <label>Provincia<input value={newAddress.provincia} onChange={(event) => setNewAddress({ ...newAddress, provincia: event.target.value })} required /></label>
                  <label>Cantón<input value={newAddress.canton} onChange={(event) => setNewAddress({ ...newAddress, canton: event.target.value })} required /></label>
                  <label>Distrito<input value={newAddress.distrito} onChange={(event) => setNewAddress({ ...newAddress, distrito: event.target.value })} required /></label>
                  <label>Señas<input value={newAddress.detalle} onChange={(event) => setNewAddress({ ...newAddress, detalle: event.target.value })} required /></label>
                  <button className="dialog-primary" disabled={busy} type="submit">{busy ? 'Guardando...' : 'Guardar dirección'}</button>
                </form>
              )}
              {addresses.length > 0 && (
                <div className="catalog-grid">
                  {addresses.map((address) => (
                    <article className="catalog-card" key={address.DireccionID}>
                      {editingAddress?.DireccionID === address.DireccionID ? (
                        <form onSubmit={handleUpdateAddress}>
                          <label>Provincia<input value={editingAddress.Provincia} onChange={(event) => setEditingAddress({ ...editingAddress, Provincia: event.target.value })} required /></label>
                          <label>Cantón<input value={editingAddress.Canton} onChange={(event) => setEditingAddress({ ...editingAddress, Canton: event.target.value })} required /></label>
                          <label>Distrito<input value={editingAddress.Distrito} onChange={(event) => setEditingAddress({ ...editingAddress, Distrito: event.target.value })} required /></label>
                          <label>Señas<input value={editingAddress.Detalle} onChange={(event) => setEditingAddress({ ...editingAddress, Detalle: event.target.value })} required /></label>
                          <button className="admin-action-button" type="submit">Guardar</button>
                          <button className="admin-action-button admin-action-secondary" type="button" onClick={() => setEditingAddress(null)}>Cancelar</button>
                        </form>
                      ) : (
                        <>
                          <h3>{address.Principal ? 'Dirección principal' : 'Dirección'}</h3>
                          <p>{address.Detalle}, {address.Distrito}, {address.Canton}, {address.Provincia}</p>
                          <button className="admin-action-button admin-action-secondary" type="button" onClick={() => setEditingAddress(address)}>Editar</button>
                          {!address.Principal && (
                            <button className="admin-action-button" type="button" onClick={() => handleSetMainAddress(address.DireccionID)}>Usar como principal</button>
                          )}
                          <button className="admin-action-button" type="button" onClick={() => handleDeleteAddress(address.DireccionID)}>Eliminar</button>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
              <button className="dialog-primary" type="button" onClick={handleLogout} disabled={busy}>
                {busy ? 'Cerrando...' : 'Cerrar sesión'}
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
