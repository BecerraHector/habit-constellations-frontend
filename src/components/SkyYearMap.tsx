import { useEffect, useRef } from 'react'
import type { SkyDay } from '@/api/types'
import { useSky } from '@/api/habits'
import { Card } from '@/components/ui'

const LUM = ['var(--lum-0)', 'var(--lum-1)', 'var(--lum-2)', 'var(--lum-3)', 'var(--lum-4)']
// El vacio de verdad (aun no habia habitos) se distingue del apagado (--lum-0):
// no es lo mismo no haber empezado que haber fallado.
const VOID = 'rgb(255 255 255 / 0.035)'

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
// Filas impares sin etiqueta, como en cualquier carta celeste: orientan sin saturar.
const WEEKDAYS = ['L', '', 'X', '', 'V', '', 'D']

function iso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function longDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function tooltipOf(day: SkyDay | undefined) {
  if (!day) return ''
  if (day.activeHabits === 0) return `${longDate(day.date)}: aun sin habitos`
  const full = day.completions === day.activeHabits && day.completions > 0
  return `${longDate(day.date)}: ${day.completions} de ${day.activeHabits}${full ? ' — pleno ✦' : ''}`
}

/**
 * Tu cielo, noche a noche: un punto por dia, todos los habitos condensados en un
 * nivel de brillo. Misma rampa --lum que el mapa de una galaxia — el usuario ya
 * sabe leerla — y el oro reservado al pleno, que ademas titila.
 */
export function SkyYearMap() {
  const now = new Date()
  const to = iso(now)
  const from = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 364))
  const { data, isLoading } = useSky(from, to)

  // El presente vive a la derecha: al cargar, el scroll arranca alli. El segundo
  // intento cubre el reflow de las fuentes, que ensancha las etiquetas unos pixeles
  // despues del primer pintado y dejaria la ultima columna a medio ver.
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scroller.current
    if (!data || !el) return
    const toEnd = () => {
      el.scrollLeft = el.scrollWidth
    }
    toEnd()
    const timer = setTimeout(toEnd, 350)
    return () => clearTimeout(timer)
  }, [data])

  if (isLoading) {
    return (
      <Card className="rise p-5 sm:p-6">
        <p className="animate-pulse text-sm text-muted">Cartografiando tus noches…</p>
      </Card>
    )
  }
  if (!data || data.days.length === 0) return null

  const byDate = new Map(data.days.map((d) => [d.date, d]))

  // Columnas de lunes a domingo; la primera arranca en el lunes anterior a `from`.
  const start = new Date(`${data.from}T00:00:00`)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const weeks: { monday: Date; dates: string[] }[] = []
  for (let monday = new Date(start); iso(monday) <= data.to; monday.setDate(monday.getDate() + 7)) {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return iso(d)
    })
    weeks.push({ monday: new Date(monday), dates })
  }

  const totalStars = data.days.reduce((sum, d) => sum + d.completions, 0)
  const plenos = data.days.filter((d) => d.level === 4 && d.activeHabits > 0).length

  return (
    <Card className="rise p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">
          Tu cielo, noche a noche
        </h2>
        <p className="text-xs text-faint tabular-nums">
          {totalStars} {totalStars === 1 ? 'estrella' : 'estrellas'} ·{' '}
          <span className={plenos > 0 ? 'text-gold-soft' : ''}>
            {plenos} {plenos === 1 ? 'pleno' : 'plenos'}
          </span>{' '}
          · ultimos 12 meses
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        {/* Etiquetas de fila fuera del scroll: siguen visibles con el presente a la vista. */}
        <div className="flex shrink-0 flex-col gap-[3px] pt-[19px]" aria-hidden>
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="flex h-[11px] items-center text-[9px] leading-none text-faint">
              {d}
            </span>
          ))}
        </div>

        <div
          ref={scroller}
          className="scroll-thin overflow-x-auto pb-1.5"
          role="img"
          aria-label={`Mapa del ultimo ano: ${totalStars} estrellas y ${plenos} dias plenos`}
        >
          <div className="flex gap-[3px]">
            {weeks.map((week, w) => {
              const month = week.monday.getMonth()
              const newMonth = w === 0 || month !== weeks[w - 1].monday.getMonth()
              return (
                <div key={iso(week.monday)} className="flex flex-col gap-[3px]">
                  <span className="h-4 overflow-visible text-[9px] leading-4 whitespace-nowrap text-faint">
                    {newMonth ? MONTHS[month] : ''}
                  </span>
                  {week.dates.map((date) => {
                    const day = byDate.get(date)
                    if (!day) {
                      // Fuera de la ventana (bordes de la primera y ultima semana).
                      return <span key={date} className="h-[11px] w-[11px]" />
                    }
                    const empty = day.activeHabits === 0
                    return (
                      <span
                        key={date}
                        title={tooltipOf(day)}
                        className={`h-[11px] w-[11px] rounded-full ${
                          day.level === 4 && !empty ? 'twinkle' : ''
                        }`}
                        style={{ background: empty ? VOID : LUM[day.level] }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-border pt-3 text-[10px] text-faint">
        <span className="h-[9px] w-[9px] rounded-full" style={{ background: VOID }} title="aun sin habitos" />
        <span className="mr-1">vacio</span>
        <span>apagado</span>
        {LUM.map((c, i) => (
          <span key={i} className="h-[9px] w-[9px] rounded-full" style={{ background: c }} />
        ))}
        <span>pleno</span>
      </div>
    </Card>
  )
}
