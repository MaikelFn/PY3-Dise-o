import { useEffect, useRef, useState } from 'react'
import { login, logout, register } from '../api'

function AuthDialog({ user, onAuthenticated, onLoggedOut, onClose }) {
  const dialogRef = useRef(null)
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)

    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())

    try {
      if (mode === 'register') {
        await register({
          nombre: values.nombre,
          apellido: values.apellido,
          correo: values.correo,
          contrasena: values.contrasena
        })
        setMode('login')
        setNotice('Cuenta creada. Ahora inicia sesión.')
        return
      }

      const result = await login({
        correo: values.correo,
        contrasena: values.contrasena
      })
      onAuthenticated(result.usuario)
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setError('')
    setBusy(true)
    try {
      await logout()
      onLoggedOut()
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      className="app-dialog auth-dialog"
      ref={dialogRef}
      aria-labelledby="auth-dialog-title"
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
          <span className="section-eyebrow">CLICKMARKET</span>
          <h2 id="auth-dialog-title">{user ? 'Tu cuenta' : mode === 'login' ? 'Te damos la bienvenida' : 'Crea tu cuenta'}</h2>
        </div>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Cerrar">×</button>
      </div>

      {user ? (
        <div className="account-summary">
          <div className="account-avatar" aria-hidden="true">{user.nombre?.charAt(0)?.toUpperCase() || 'U'}</div>
          <strong>{user.nombre} {user.apellido}</strong>
          <span>{user.correo}</span>
          <button className="dialog-primary" type="button" onClick={handleLogout} disabled={busy}>
            {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-name-fields">
              <label>Nombre<input name="nombre" autoComplete="given-name" maxLength="100" required /></label>
              <label>Apellido<input name="apellido" autoComplete="family-name" maxLength="100" required /></label>
            </div>
          )}
          <label>Correo electrónico
            <input name="correo" type="email" autoComplete="email" maxLength="150" required />
          </label>
          <label>Contraseña
            <input
              name="contrasena"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength="8"
              maxLength="72"
              required
            />
          </label>
          {notice && <p className="dialog-notice" role="status">{notice}</p>}
          {error && <p className="dialog-error" role="alert">{error}</p>}
          <button className="dialog-primary" type="submit" disabled={busy}>
            {busy ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
          <p className="auth-switch">
            {mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
            {' '}
            <button type="button" onClick={() => { setError(''); setNotice(''); setMode(mode === 'login' ? 'register' : 'login') }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </form>
      )}
      {error && user && <p className="dialog-error" role="alert">{error}</p>}
    </dialog>
  )
}

export default AuthDialog
