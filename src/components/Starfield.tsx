import { useEffect, useRef } from 'react'

interface Star {
  x: number // 0..1 relativo al ancho
  y: number // 0..1 relativo al alto
  r: number
  depth: number // 0 lejos .. 1 cerca; gobierna deriva y brillo
  phase: number
  speed: number
  tint: string
}

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 1 -> 0
}

const TINTS = ['255 255 255', '236 234 253 ', '179 167 255', '253 230 138']

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.4 + Math.random() * 1.1,
    depth: Math.random(),
    phase: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.9,
    tint: TINTS[Math.floor(Math.random() * TINTS.length)].trim(),
  }))
}

/**
 * Cielo vivo en canvas: estrellas que parpadean, derivan despacio (las cercanas
 * mas rapido: parallax) y, muy de vez en cuando, una fugaz. Puramente decorativo;
 * con prefers-reduced-motion se pinta una sola vez, quieto.
 */
export function Starfield({ count = 140 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const stars = makeStars(count)
    const meteors: Meteor[] = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let nextMeteor = performance.now() + 6000 + Math.random() * 14000

    function resize() {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw(now: number) {
      if (!canvas || !ctx) return
      const w = window.innerWidth
      const h = window.innerHeight
      const t = now / 1000
      ctx.clearRect(0, 0, w, h)

      for (const s of stars) {
        // Deriva diagonal lentisima; las estrellas "cercanas" se mueven mas.
        const drift = reduced ? 0 : t * (0.002 + s.depth * 0.004)
        const x = ((s.x + drift) % 1) * w
        const y = ((s.y + drift * 0.35) % 1) * h
        const tw = reduced ? 0.75 : 0.55 + 0.45 * Math.sin(t * s.speed + s.phase)
        const alpha = (0.25 + s.depth * 0.55) * tw
        const r = s.r * (0.8 + s.depth * 0.5)

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgb(${s.tint} / ${alpha.toFixed(3)})`
        ctx.fill()

        // Halo sutil solo en las mas brillantes.
        if (s.depth > 0.82) {
          ctx.beginPath()
          ctx.arc(x, y, r * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgb(${s.tint} / ${(alpha * 0.12).toFixed(3)})`
          ctx.fill()
        }
      }

      if (!reduced) {
        if (now > nextMeteor && meteors.length === 0) {
          meteors.push({
            x: w * (0.2 + Math.random() * 0.6),
            y: h * 0.1,
            vx: -(3 + Math.random() * 3),
            vy: 2 + Math.random() * 2,
            life: 1,
          })
          nextMeteor = now + 12000 + Math.random() * 20000
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i]
          m.x += m.vx
          m.y += m.vy
          m.life -= 0.016
          if (m.life <= 0) {
            meteors.splice(i, 1)
            continue
          }
          const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 12, m.y - m.vy * 12)
          grad.addColorStop(0, `rgb(253 230 138 / ${(m.life * 0.9).toFixed(3)})`)
          grad.addColorStop(1, 'rgb(253 230 138 / 0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(m.x - m.vx * 12, m.y - m.vy * 12)
          ctx.stroke()
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduced) {
      draw(performance.now())
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return (
    <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />
  )
}
