import { useState, type FormEvent } from 'react'
import type { Friend } from '@/api/types'
import {
  useFriends,
  useIncomingRequests,
  useInviteCode,
  useOutgoingRequests,
  useRegenerateInviteCode,
  useRemoveFriend,
  useRespondRequest,
  useSendRequest,
} from '@/api/social'
import { ApiError } from '@/lib/http'
import { Button, Card, ConfirmButton, ErrorText, Field } from '@/components/ui'

function sinceDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * El codigo de invitacion es una credencial: se muestra solo el propio, se puede
 * copiar y regenerar (lo que invalida el anterior). Al lado, el campo para enviar
 * una solicitud con el codigo de otra persona.
 */
function InviteCard() {
  const { data } = useInviteCode()
  const regenerate = useRegenerateInviteCode()
  const send = useSendRequest()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  async function copy() {
    if (!data) return
    await navigator.clipboard.writeText(data.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setFeedback(null)
    try {
      const req = await send.mutateAsync(code.trim())
      setFeedback({ ok: true, text: `Solicitud enviada a ${req.displayName}.` })
      setCode('')
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof ApiError ? err.message : 'No se pudo conectar',
      })
    }
  }

  return (
    <Card className="rise p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">
            Tu codigo de invitacion
          </h2>
          <p className="font-display mt-2 text-2xl font-semibold tracking-wider text-ink tabular-nums">
            {data?.inviteCode ?? '····-····'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => void copy()} disabled={!data}>
            {copied ? '✓ Copiado' : 'Copiar'}
          </Button>
          <ConfirmButton
            confirmLabel="Invalidar el actual"
            onConfirm={() => regenerate.mutate()}
            busy={regenerate.isPending}
          >
            Regenerar
          </ConfirmButton>
        </div>
      </div>
      <p className="mt-2 text-xs text-faint">
        Compartelo solo con quien quieras de amigo; regenerarlo deja el anterior sin efecto.
      </p>

      <form onSubmit={onSend} className="mt-5 flex items-end gap-2 border-t border-border pt-5">
        <div className="flex-1">
          <Field
            label="Anadir amigo"
            hint="su codigo"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={16}
            placeholder="ABCD-1234"
          />
        </div>
        <Button type="submit" busy={send.isPending}>
          Enviar
        </Button>
      </form>
      {feedback &&
        (feedback.ok ? (
          <p className="mt-3 text-sm text-gold-soft">{feedback.text}</p>
        ) : (
          <div className="mt-3">
            <ErrorText>{feedback.text}</ErrorText>
          </div>
        ))}
    </Card>
  )
}

/** Solo el destinatario puede responder; las rechazadas no se pueden reenviar. */
function RequestsSection() {
  const incoming = useIncomingRequests()
  const outgoing = useOutgoingRequests()
  const respond = useRespondRequest()

  const hasIncoming = (incoming.data?.length ?? 0) > 0
  const hasOutgoing = (outgoing.data?.length ?? 0) > 0
  if (!hasIncoming && !hasOutgoing) return null

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">Solicitudes</h2>

      {incoming.data?.map((req) => (
        <Card key={req.requestId} className="rise flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">{req.displayName}</span> quiere ser tu amigo
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              busy={respond.isPending}
              onClick={() => respond.mutate({ requestId: req.requestId, accept: false })}
            >
              Rechazar
            </Button>
            <Button
              busy={respond.isPending}
              onClick={() => respond.mutate({ requestId: req.requestId, accept: true })}
            >
              Aceptar
            </Button>
          </div>
        </Card>
      ))}

      {hasOutgoing && (
        <p className="text-xs text-faint">
          Esperando respuesta:{' '}
          {outgoing.data!.map((req) => (
            <span
              key={req.requestId}
              className="mr-1.5 inline-block rounded-full border border-border bg-white/[0.04] px-2.5 py-0.5 text-muted"
            >
              {req.displayName}
            </span>
          ))}
        </p>
      )}
    </section>
  )
}

function FriendStat({ value, label, gold = false }: { value: number | string; label: string; gold?: boolean }) {
  return (
    <div>
      <div
        className={`font-display text-lg leading-none font-semibold tabular-nums ${
          gold ? 'text-gold-soft [text-shadow:0_0_18px_rgb(255_212_121/0.4)]' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] tracking-[0.12em] text-faint uppercase">{label}</div>
    </div>
  )
}

/** Solo agregados: ni nombres de habitos, ni email, ni codigo. */
function FriendCard({ friend, index }: { friend: Friend; index: number }) {
  const remove = useRemoveFriend()
  const allDone = friend.activeHabits > 0 && friend.completedToday === friend.activeHabits

  return (
    <Card
      className="rise p-5 transition-colors duration-300 hover:border-border-strong sm:p-6"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-ink">{friend.displayName}</h3>
          <p className="mt-0.5 text-xs text-faint">amigos desde el {sinceDate(friend.friendsSince)}</p>
        </div>
        <ConfirmButton
          aria-label={`Eliminar a ${friend.displayName}`}
          onConfirm={() => remove.mutate(friend.userId)}
          busy={remove.isPending}
        >
          Eliminar
        </ConfirmButton>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-border pt-4">
        <FriendStat
          value={`${friend.completedToday}/${friend.activeHabits}`}
          label="hoy"
          gold={allDone}
        />
        <FriendStat value={friend.bestCurrentStreak} label="mejor racha" gold={friend.bestCurrentStreak > 0} />
        <FriendStat value={friend.longestStreakEver} label="racha historica" />
        <FriendStat value={friend.totalStars} label="estrellas" />
        <FriendStat value={friend.totalConstellations} label="constelaciones" />
      </div>
    </Card>
  )
}

export function FriendsPage() {
  const friends = useFriends()

  return (
    <>
      <header className="mx-auto max-w-2xl px-4 pt-6 pb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Amigos</h1>
        <p className="mt-1 text-sm text-muted">
          Cielos vecinos: ves su constancia agregada, nunca sus habitos.
        </p>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 pb-20">
        <InviteCard />
        <RequestsSection />

        <section className="space-y-4">
          {friends.isLoading && (
            <p className="animate-pulse text-center text-muted">Buscando cielos vecinos...</p>
          )}
          {friends.data && friends.data.content.length === 0 && (
            <Card className="px-8 py-10 text-center text-sm text-muted">
              Aun nadie orbita cerca. Comparte tu codigo para empezar.
            </Card>
          )}
          {friends.data && friends.data.content.length > 0 && (
            <>
              <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">
                Tus amigos
              </h2>
              {friends.data.content.map((f, i) => (
                <FriendCard key={f.userId} friend={f} index={i} />
              ))}
            </>
          )}
        </section>
      </main>
    </>
  )
}
