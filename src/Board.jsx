import { useCallback, useEffect, useRef, useState } from 'react'
import HowToPlay from './HowToPlay'
import { SLIDES as HOW_TO_SLIDES } from './howToSlides'
import { ocGame, watchGame } from './api'
import Results from './Results'
import { LEVELS, SITE_NAME, systemInfo } from './config'
import { playBonus, playFinish, playPlace, playReject, setSoundOn, soundOn } from './sounds'
import { Button, ChaosTitle, Monitor } from './ui'

// The projector: every team's patient. Each body system fills up as its organs come back; a rejection shakes the
// team's monitor and drops its vitals. The game ends on its own once every patient is rebuilt. Every team rebuilds
// the same organs, so the projector shows how full each system is, not WHICH organs (no copying); the results
// show the answer key.
export default function Board({ session, onLobby, onNewGame }) {
  const [board, setBoard] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sound, setSound] = useState(soundOn)
  const last = useRef(null) // each team's last event time, to hear what changed

  const call = useCallback((payload) => ocGame({ ...payload, game_id: session.gameId, host_token: session.hostToken }), [session])

  // One sound per update, the biggest news first: a patient rebuilt, a rejection, a bonus, an organ placed
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
      else if (kinds.has('bonus')) playBonus()
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
          <p className="text-sm text-muted">Level {level?.id}: {level?.name} · {board.game.organs} organs per patient · {board.game.systems.length} body systems</p>
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
        <div className="space-y-3">
          <Monitor vitals={p.vitals} />
          <div>
            <div className="flex justify-between text-sm font-semibold"><span>Organs back</span><span>{p.placed}/{p.total}</span></div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(100 * p.placed) / p.total}%` }} /></div>
          </div>
          <p className="text-sm text-muted">🚨 {p.rejections} rejection{p.rejections === 1 ? '' : 's'}{p.bonuses_open ? ` · ⭐ ${p.bonuses_open} bonus card${p.bonuses_open === 1 ? '' : 's'} out` : ''}</p>
          {p.finished && <p className="pop rounded-2xl bg-ok-soft px-3 py-2 text-center font-display text-lg font-bold text-ok">{medal[p.finish_rank - 1] ?? '✅'} Patient rebuilt!</p>}
        </div>

        <ul className="grid grid-cols-2 gap-1.5 self-start sm:grid-cols-3">
          {p.systems.map((s) => {
            const info = systemInfo(s.id)
            const full = s.expected > 0 && s.organs.length >= s.expected
            return (
              <li key={s.id} className={`rounded-xl border px-2 py-1.5 ${full ? 'border-ok bg-ok-soft' : 'border-line bg-panel'}`}>
                <p className="flex items-center justify-between gap-1 text-xs font-bold" style={{ color: info.color }}>
                  <span className="truncate">{info.emoji} {s.name}</span>
                  <span className="shrink-0 text-muted">{s.organs.length}/{s.expected}</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1" aria-label={`${s.organs.length} of ${s.expected} organs back`}>
                  {Array.from({ length: Math.max(s.expected, s.organs.length) }, (_, k) => (
                    <span key={k} className={`h-3 w-5 rounded-full ${k < s.organs.length ? 'pop' : 'border border-dashed border-line bg-card'}`} style={k < s.organs.length ? { background: info.color } : undefined} />
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {fresh && (
        <p className={`pop mx-5 mb-4 rounded-2xl px-4 py-2 text-sm font-semibold ${event.kind === 'reject' ? 'bg-bad-soft text-bad' : event.kind === 'bonus' ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent'}`} key={event.at}>
          {event.kind === 'reject' && `🚨 Rejected! ${event.by} tried the ${event.system} system. Vitals dropping!`}
          {event.kind === 'place' && `💓 ${event.by} put an organ back in the ${event.system} system`}
          {event.kind === 'bonus' && `⭐ Bonus! ${event.by} found an organ that does double duty`}
          {event.kind === 'finish' && `🎉 ${event.by} placed the last organ. The patient is stable!`}
        </p>
      )}
    </article>
  )
}
