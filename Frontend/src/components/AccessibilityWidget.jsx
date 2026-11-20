import { useEffect, useRef, useState } from 'react'
import accessibilityLogo from '../assets/accessibility-symbol.png'
import './AccessibilityWidget.css'

function AccessibilityWidget({ grayscale, onToggleGrayscale, textSize, onChangeTextSize, onReset }) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)
  const panelId = 'accessibility-options'

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div className="accessibility-widget">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? 'Cerrar opciones de accesibilidad' : 'Abrir opciones de accesibilidad'}
        className="accessibility-trigger"
        onClick={() => setOpen((current) => !current)}
        ref={toggleRef}
        type="button"
      >
        <img alt="" aria-hidden="true" src={accessibilityLogo} />
      </button>
      <section aria-labelledby="accessibility-title" className="accessibility-panel" hidden={!open} id={panelId} role="region">
          <div className="accessibility-panel-heading">
            <div>
              <span className="accessibility-kicker">PERSONALIZA TU EXPERIENCIA</span>
              <h2 id="accessibility-title">Accesibilidad</h2>
            </div>
            <button aria-label="Cerrar opciones de accesibilidad" className="accessibility-close" onClick={() => setOpen(false)} type="button">
              ×
            </button>
          </div>

          <div className="accessibility-option">
            <div>
              <strong>Tamaño del texto</strong>
              <span>Ajusta la lectura sin perder contenido</span>
            </div>
            <div aria-label="Tamaño del texto" className="accessibility-text-controls" role="group">
              <button
                aria-label="Reducir tamaño del texto"
                aria-pressed={textSize === 'small'}
                disabled={textSize === 'small'}
                onClick={() => onChangeTextSize('small')}
                type="button"
              >
                A−
              </button>
              <button
                aria-label="Tamaño de texto normal"
                aria-pressed={textSize === 'normal'}
                disabled={textSize === 'normal'}
                onClick={() => onChangeTextSize('normal')}
                type="button"
              >
                A
              </button>
              <button
                aria-label="Aumentar tamaño del texto"
                aria-pressed={textSize === 'large'}
                disabled={textSize === 'large'}
                onClick={() => onChangeTextSize('large')}
                type="button"
              >
                A+
              </button>
            </div>
          </div>

          <button
            aria-pressed={grayscale}
            className="accessibility-gray-toggle"
            onClick={onToggleGrayscale}
            type="button"
          >
            <span>
              <strong>Tono de grises</strong>
              <small>Reduce los colores de la página</small>
            </span>
            <span aria-hidden="true" className={`accessibility-switch${grayscale ? ' is-on' : ''}`}><i /></span>
          </button>

          <button className="accessibility-reset" onClick={onReset} type="button">Restablecer opciones</button>
      </section>
    </div>
  )
}

export default AccessibilityWidget
