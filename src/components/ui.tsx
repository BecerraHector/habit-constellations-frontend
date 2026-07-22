import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  busy?: boolean
}

/**
 * El primario lleva el gradiente indigo->violeta y es el unico boton que brilla:
 * un solo punto de enfasis por vista. `busy` muestra el spinner y bloquea el click
 * sin que el boton cambie de tamano.
 */
export function Button({ variant = 'primary', busy = false, className = '', children, disabled, ...props }: ButtonProps) {
  const styles = {
    primary:
      'bg-[linear-gradient(135deg,var(--color-indigo-deep),var(--color-violet-hot))] text-white font-semibold shadow-[0_4px_24px_-6px_rgb(139_125_255/0.55)] hover:shadow-[0_6px_28px_-6px_rgb(139_125_255/0.75)] hover:brightness-110 active:scale-[0.98]',
    ghost:
      'bg-white/[0.03] text-muted border border-border hover:text-ink hover:border-border-strong hover:bg-white/[0.06] active:scale-[0.98]',
    danger:
      'bg-transparent text-danger border border-danger/40 hover:bg-danger/10 active:scale-[0.98]',
  }[variant]

  return (
    <button
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-space disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 ${styles} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {busy && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
        />
      )}
      {children}
    </button>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }

export function Field({ label, hint, className = '', ...props }: FieldProps) {
  const id = useId()
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium tracking-[0.12em] text-muted uppercase">{label}</span>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </span>
      <input
        id={id}
        className={`w-full rounded-xl border border-border bg-space-deep/60 px-3.5 py-2.5 text-ink transition-all duration-200 outline-none placeholder:text-faint hover:border-border-strong focus:border-primary/70 focus:bg-space-deep/80 focus:shadow-[0_0_0_3px_rgb(139_125_255/0.15),0_0_24px_-8px_rgb(139_125_255/0.5)] ${className}`}
        {...props}
      />
    </label>
  )
}

/**
 * Panel de vidrio: blur, borde tenue y un filo de luz arriba (el reflejo tipico
 * del cristal contra el cielo). `glow` anade un halo exterior para las tarjetas
 * que deben destacar.
 */
export function Card({
  children,
  className = '',
  glow = false,
  style,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      style={style}
      className={`relative rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-32px_rgb(3_3_9/0.9)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-2xl before:bg-[linear-gradient(90deg,transparent,rgb(139_125_255/0.45),transparent)] ${glow ? 'shadow-[0_0_60px_-18px_rgb(139_125_255/0.45),0_24px_60px_-32px_rgb(3_3_9/0.9)]' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  )
}

/**
 * Accion destructiva sin dialogo modal: el primer click arma el boton (pasa a
 * "Confirmar" en tinte de peligro) y el segundo ejecuta. Se desarma solo.
 */
export function ConfirmButton({
  children,
  confirmLabel = 'Confirmar',
  onConfirm,
  busy = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmLabel?: string
  onConfirm: () => void
  busy?: boolean
}) {
  const [arming, setArming] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function onClick() {
    if (!arming) {
      setArming(true)
      timer.current = setTimeout(() => setArming(false), 3500)
      return
    }
    if (timer.current) clearTimeout(timer.current)
    setArming(false)
    onConfirm()
  }

  return (
    <Button variant={arming ? 'danger' : 'ghost'} onClick={onClick} busy={busy} className={className} {...props}>
      {arming ? confirmLabel : children}
    </Button>
  )
}

/** Marca de la app: el nombre en la display, con el gradiente de la casa. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <h1
      className={`font-display bg-[linear-gradient(115deg,#eceafd_20%,#b3a7ff_55%,#ffd479_95%)] bg-clip-text font-semibold text-transparent ${className}`}
    >
      Forja de Constelaciones
    </h1>
  )
}
