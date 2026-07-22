import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles = {
    primary:
      'bg-primary text-space hover:bg-primary-strong disabled:opacity-50 font-medium shadow-[0_0_20px_-4px] shadow-primary/60',
    ghost: 'bg-transparent text-muted hover:text-ink border border-border hover:border-primary/50',
    danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
  }[variant]

  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm transition disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Field({ label, ...props }: FieldProps) {
  const id = useId()
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      <input
        id={id}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink outline-none transition placeholder:text-faint focus:border-primary focus:ring-1 focus:ring-primary/40"
        {...props}
      />
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface/70 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-danger">{children}</p>
}
