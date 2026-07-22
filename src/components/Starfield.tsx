import { useMemo } from 'react'

// Fondo de estrellas fijas, generadas una vez. Puramente decorativo: no captura
// clics y queda detras de todo el contenido.
export function Starfield({ count = 90 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() < 0.85 ? 1 : 2,
        opacity: 0.25 + Math.random() * 0.6,
      })),
    [count],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.key}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  )
}
