import { useCallback, useEffect, useRef, useState } from 'react'
import HowToPlay from './HowToPlay'
import { SLIDES as HOW_TO_SLIDES } from './howToSlides'
import { ocGame, watchGame } from './api'
import Results from './Results'
import { LEVELS, SITE_NAME, systemInfo } from './config'
import { playBonus, playFinish, playPlace, playReject, setSoundOn, soundOn } from './sounds'
import { Button, ChaosTitle, Monitor } from './ui'

// The projector: every team's patient, rebuilt one body system at a time. Each team's path shows the systems it has
// finished, the one it's on now (filling up as cards come in), and "?" for the ones still to come. A rejection
// shakes the team's card and drops its vitals. Every team rebuilds the same organs, so the projector shows how full
// a system is, not WHICH organs (no copying); the results show the answer key. The game ends on its own once every
// patient is rebuilt.
export default function Board({ session, onLobby, onNewGame }) {
  const [board, setBoard] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sound, setSound] = useState(soundOn)
  const last = useRef(null) // each team's last event time, to hear what changed

  const call = useCallback((payload) => ocGame({ ...payload, game_id: session.gameId, host_token: session.hostToken }), [session])

  // One sound per update, the biggest news first: a patient rebuilt, a rejection, a system complete, an organ placed
  const listen = (d) => {
    const now = new Map(d.teams.map((t) => [t.index, t.patient?.last_event ?? null]))
    if (last.current) {
      const kinds = new Set()
      for (const [i, event] of now) {
        const before = last.current.get(i)
        if (event && event.at !== before?.at) kinds.add(event.kind)
      }
      if (kinds.has('finish')) playFinish()
      else if (kinds.has('reject')) playReject()
      else if (kinds.has('system')) playBonus()
      else if (kinds.has('place')) playPlace()
    }
    last.current = now
  }

  const load = useCallback(() => call({ action: 'board' }).then((d) => { listen(d); setBoard(d); setError('') }).catch((e) => setError(e.message)), [call])
  useEffect(() => {
    load()
    return watchGame(session.gameId, ['state', 'lobby'], load, 5000)
  }, [session, load])

  async function end() {
    if (!window.confirm('End the game and see the results?')) return
    setBusy(true)
    try { await call({ action: 'end_game' }); await load() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (!board) return <main className="er-bg flex min-h-dvh items-center justify-center"><p className="text-muted">{error || 'Paging the doctors…'}</p></main>
  if (board.game.status === 'finished') return <Results session={session} onNewGame={onNewGame} onLobby={onLobby} />
  const level = LEVELS.find((l) => l.id === board.game.level)
  const serverNow = Date.parse(board.server_now)

  return (
    <main className="er-bg min-h-dvh p-4 text-ink sm:p-6">
      {/* The visual how-to guide: opens once per game, skippable */}
      <HowToPlay site="organized" gameId={session.gameId} name={SITE_NAME} accent="#0f8b7d" slides={HOW_TO_SLIDES} />
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-info">join code {session.joinCode}</p>
          <h1 className="font-display text-4xl font-bold text-accent">🚑 <ChaosTitle text={SITE_NAME} /></h1>
          <p className="text-sm text-muted">Level {level?.id}: {level?.name} · {board.game.stages} body systems, one at a time · {board.game.organs} organs per patient</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {board.waiting > 0 && <Button variant="chaos" className="!px-4 !py-2 text-sm" onClick={onLobby}>{board.waiting} waiting to join</Button>}
          <Button variant="outline" className="!px-4 !py-2 text-sm" aria-label={sound ? 'Mute sounds' : 'Turn sounds on'} title={sound ? 'Mute sounds' : 'Turn sounds on'}
            onClick={() => { setSoundOn(!sound); setSound(!sound); if (!sound) playPlace() }}>
            {sound ? '🔊' : '🔇'}
          </Button>
          <Button variant="outline" className="!px-4 !py-2 text-sm" onClick={onLobby}>Lobby</Button>
          <Button variant="danger" className="!px-4 !py-2 text-sm" disabled={busy} onClick={end}>End game</Button>
        </div>
      </header>
      {error && <p className="mx-auto mt-3 max-w-7xl font-bold text-bad">{error}</p>}

      <section className={`mx-auto mt-6 grid max-w-7xl gap-5 ${board.teams.length > 1 ? 'lg:grid-cols-2' : ''} ${board.teams.length > 4 ? '2xl:grid-cols-3' : ''}`}>
        {board.teams.map((t) => <PatientCard key={t.index} team={t} serverNow={serverNow} />)}
      </section>
    </main>
  )
}

function PatientCard({ team, serverNow }) {
  const p = team.patient
  if (!p) return null
  const event = p.last_event
  const fresh = event && serverNow - Date.parse(event.at) < 6000
  const rejected = fresh && event.kind === 'reject'
  const medal = ['🥇', '🥈', '🥉']
  const now = p.current ? systemInfo(p.current.id) : null
  return (
    <article className={`soft-shadow overflow-hidden rounded-3xl border bg-card ${rejected ? 'reject alarm border-bad' : 'border-line'}`} key={rejected ? event.at : 'card'}>
      <div className="flex items-center justify-between gap-3 px-5 py-3" style={{ borderBottom: `4px solid ${team.color}` }}>
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-bold">{team.name}</h2>
          <p className="truncate text-sm text-muted">{team.members.join(', ')}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-accent">{p.points}</p>
          <p className="text-sm text-muted">points</p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[13rem_1fr]">
        <div className="space-y-2">
          <Monitor vitals={p.vitals} />
          <p className="text-sm text-muted">🚨 {p.rejections} rejection{p.rejections === 1 ? '' : 's'} · {p.stage}/{p.stages} systems done</p>
        </div>

        <div>
          {/* Now rebuilding: the current system, filling up */}
          {p.finished ? (
            <p className="pop rounded-2xl bg-ok-soft px-4 py-5 text-center font-display text-2xl font-bold text-ok">{medal[p.finish_rank - 1] ?? '✅'} Patient rebuilt!</p>
          ) : now && (
            <div className="rounded-2xl border-2 px-4 py-3" style={{ borderColor: now.color }}>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted">Now rebuilding</p>
              <p className="font-display text-3xl font-bold" style={{ color: now.color }}>{now.emoji} {p.current.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`${p.current.placed} of ${p.current.total} organs in`}>
                {Array.from({ length: p.current.total }, (_, k) => (
                  <span key={k} className={`h-4 w-8 rounded-full ${k < p.current.placed ? 'pop' : 'border-2 border-dashed border-line'}`} style={k < p.current.placed ? { background: now.color } : undefined} />
                ))}
              </div>
            </div>
          )}

          {/* The path: done, now, and still to come */}
          <ol className="mt-3 flex flex-wrap items-center gap-1.5">
            {p.systems.map((s, i) => {
              const info = s.id ? systemInfo(s.id) : null
              return (
                <li key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted">→</span>}
                  {s.done ? (
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: info.color }}>✓ {info.emoji} {s.name}</span>
                  ) : s.id ? (
                    <span className="rounded-full border-2 bg-card px-2.5 py-1 text-xs font-bold" style={{ borderColor: info.color, color: info.color }}>{info.emoji} {s.name}</span>
                  ) : (
                    <span className="rounded-full border-2 border-dashed border-line px-3 py-1 text-xs font-bold text-muted">?</span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {fresh && (
        <p className={`pop mx-5 mb-4 rounded-2xl px-4 py-2 text-sm font-semibold ${event.kind === 'reject' ? 'bg-bad-soft text-bad' : event.kind === 'system' || event.kind === 'finish' ? 'bg-ok-soft text-ok' : 'bg-accent-soft text-accent'}`} key={event.at}>
          {event.kind === 'reject' && `🚨 Rejected! ${event.by} played a card that isn't ${event.system}. Vitals dropping!`}
          {event.kind === 'place' && `💓 ${event.by} put an organ back in the ${event.system} system`}
          {event.kind === 'system' && `✅ ${event.system} system complete! ${p.current ? `Next up: ${p.current.name}` : ''}`}
          {event.kind === 'finish' && `🎉 ${event.by} placed the last organ. The patient is stable!`}
        </p>
      )}
    </article>
  )
}
