import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ocGame, watchGame } from './api'
import { HUB_URL, LEVELS, MAX_TEAMS, MIN_TEAMS, SITE_NAME, TEAM_COLORS } from './config'
import { saveSession } from './session'
import { Button, ChaosTitle, Label, Panel } from './ui'

const choice = (on) =>
  `rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel hover:bg-hover'}`

// Leader lobby: create the game -> teams -> finalize -> level, how many body systems, organs per system -> start.
// The systems themselves are drawn at random when the game starts, in a random order.
// Students join from their phones; the leader puts them on teams. A team of one works.
export default function Lobby({ onStart, onOpenBoard, hasGame, resume, onCloseGame }) {
  const [session, setSession] = useState(resume?.session ?? null)
  const [teamNames, setTeamNames] = useState(resume?.teams?.length ? resume.teams : ['Team 1', 'Team 2'])
  const [finalized, setFinalized] = useState(Boolean(resume?.finalized))
  const [catalog, setCatalog] = useState(null)
  const [level, setLevel] = useState(1)
  const [systemCount, setSystemCount] = useState(4)
  const [perSystem, setPerSystem] = useState(3)
  const [players, setPlayers] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { ocGame({ action: 'catalog' }).then(setCatalog).catch((e) => setError(e.message)) }, [])
  useEffect(() => {
    if (!session) return undefined
    const load = () => ocGame({ action: 'list_players', game_id: session.gameId, host_token: session.hostToken }).then((d) => setPlayers(d.players)).catch(() => {})
    load()
    return watchGame(session.gameId, ['lobby'], load, 10000)
  }, [session])

  const call = (payload) => ocGame({ ...payload, game_id: session.gameId, host_token: session.hostToken })
  const run = async (fn) => {
    setBusy(true)
    setError('')
    try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const teamLabel = (i) => teamNames[i].trim() || `Team ${i + 1}`
  const waiting = players.filter((p) => p.approval_status === 'pending')
  const sizes = teamNames.map((_, i) => players.filter((p) => p.approval_status === 'approved' && p.team_index === i).length)
  const emptyTeams = teamNames.map((_, i) => i).filter((i) => sizes[i] === 0)
  const organCount = systemCount * perSystem + (level === 3 ? Math.min(3, Math.max(1, Math.floor(systemCount / 2))) : 0)
  const enoughSystems = catalog ? catalog.systems.filter((s) => s.organs >= perSystem).length : 11

  const create = () => run(async () => {
    const d = await ocGame({ action: 'create_game' })
    const s = { gameId: d.game.id, hostToken: d.host_token, joinCode: d.game.join_code }
    saveSession(s)
    setSession(s)
  })
  const finalize = () => run(async () => { await call({ action: 'set_teams', team_names: teamNames.map((_, i) => teamLabel(i)) }); setFinalized(true) })
  const studentAction = (payload) => run(async () => { await call(payload); setPlayers((await call({ action: 'list_players' })).players) })
  const start = () => run(async () => {
    await call({ action: 'start_game', team_names: teamNames.map((_, i) => teamLabel(i)), level, system_count: systemCount, per_system: perSystem })
    onStart(session)
  })

  const joinUrl = session ? `${window.location.origin}/join?code=${session.joinCode}` : ''

  return (
    <main className="er-bg min-h-dvh p-4 text-ink sm:p-8">
      {hasGame && <button onClick={onOpenBoard} className="fixed right-4 top-4 z-20 rounded-2xl border border-line bg-card px-4 py-2 font-bold hover:bg-hover">Back to the game</button>}

      <header className="mx-auto mb-8 max-w-5xl text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-info"><ChaosTitle text={SITE_NAME} /></p>
        <h1 className="mt-1 font-display text-5xl font-bold text-accent">Leader Lobby</h1>
        <p className="mt-2 text-muted">Set up the teams, choose how hard, then let the chaos begin.</p>
        <p className="mt-2 text-sm font-bold">
          <a href={HUB_URL} className="text-info hover:underline">← All games</a>
          <span className="mx-2 text-muted">·</span><a href="/submit" className="text-info hover:underline">Submit organs</a>
          <span className="mx-2 text-muted">·</span><a href="/review" className="text-info hover:underline">Review queue</a>
        </p>
        <div className="mt-6">
          {session ? (
            <div className="flex flex-col items-center gap-3">
              <p className="font-bold text-ok">Game ready!</p>
              <Button variant="outline" className="!px-4 !py-2 text-sm" disabled={busy} onClick={() => window.confirm('Close this game? Every student will be sent back to the join page.') && onCloseGame()}>Close game and start fresh</Button>
            </div>
          ) : <Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create new game'}</Button>}
          {error && <p className="mt-3 font-bold text-bad">{error}</p>}
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        <Panel>
          <h2 className="font-display text-2xl font-bold text-accent">Join</h2>
          <p className="mt-3">Join code: {session ? <span className="font-display text-3xl font-bold tracking-widest text-info">{session.joinCode}</span> : <span className="text-muted">Not created yet</span>}</p>
          {session && (
            <div className="mt-5 flex flex-col items-center">
              <div className="rounded-2xl border border-line bg-white p-4"><QRCodeSVG value={joinUrl} size={200} title={`Join code ${session.joinCode}`} /></div>
              <p className="mt-3 text-center text-sm text-muted">Students scan this with their phone camera to join.</p>
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
            <p className="font-bold text-ink">How it works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Every team gets the same patient, whose organs are all mixed up. They&apos;re dealt to the team&apos;s phones as cards.</li>
              <li>The patient is rebuilt one body system at a time, like a puzzle (say Skeletal, then Cardiovascular, then Nervous). Students find the cards that belong to the current system and play them.</li>
              <li>A card that doesn&apos;t belong is a rejection: it stays in hand and the patient&apos;s vitals drop. Rebuild the whole patient first, with the best vitals, to win.</li>
            </ol>
          </div>
        </Panel>

        <Panel>
          <h2 className="font-display text-2xl font-bold text-accent">Teams</h2>
          <div className="mt-4 space-y-2">
            {teamNames.map((name, i) => (
              <div key={i} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-panel">
                <span className="w-2 self-stretch" style={{ background: TEAM_COLORS[i] }} aria-hidden="true" />
                <input className="min-w-0 flex-1 bg-transparent py-2.5 font-display text-lg font-semibold outline-none" value={name} maxLength={40} disabled={finalized}
                  aria-label={`Name for team ${i + 1}`} onChange={(e) => setTeamNames(teamNames.map((n, k) => (k === i ? e.target.value : n)))} />
                {finalized && <span className="pr-3 text-sm text-muted">{sizes[i]} student{sizes[i] === 1 ? '' : 's'}</span>}
                {!finalized && teamNames.length > MIN_TEAMS && (
                  <button type="button" onClick={() => setTeamNames(teamNames.filter((_, k) => k !== i))} aria-label={`Remove team ${i + 1}`} className="mr-3 px-2 text-muted hover:text-bad">✕</button>
                )}
              </div>
            ))}
          </div>
          {!finalized && teamNames.length < MAX_TEAMS && <Button variant="outline" className="mt-3 w-full" onClick={() => setTeamNames([...teamNames, `Team ${teamNames.length + 1}`])}>+ Add team ({teamNames.length}/{MAX_TEAMS})</Button>}
          <p className="mt-2 text-xs text-muted">Teams of 3 to 6 work best. Every team needs at least one student; the organs are split between the team&apos;s phones.</p>
          <Button className="mt-4 w-full" disabled={!session || finalized || busy} onClick={finalize}>{finalized ? 'Teams finalized' : 'Finalize teams'}</Button>
          {finalized && <button type="button" className="mt-2 text-sm font-bold text-info" onClick={() => setFinalized(false)}>Edit teams</button>}

          {finalized && (
            <div className="mt-6 space-y-5 border-t border-line pt-4">
              <div>
                <Label>1. Level</Label>
                <div className="mt-2 space-y-2">
                  {LEVELS.map((l) => (
                    <button key={l.id} type="button" className={`${choice(level === l.id)} w-full`} onClick={() => setLevel(l.id)}>
                      <span className="font-display text-base">Level {l.id}: {l.name}</span>
                      <span className="block text-xs font-normal text-muted">{l.text}{l.id === 3 && catalog ? ` (${catalog.two_system} two-system organs available)` : ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>2. How many body systems</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(catalog?.system_counts ?? [3, 4, 5, 6]).map((n) => <button key={n} type="button" className={`${choice(systemCount === n)} text-center`} onClick={() => setSystemCount(n)}>{n}</button>)}
                </div>
                <p className="mt-1 text-xs text-muted">Drawn at random when the game starts, in a random order (the same for every team). Each one is revealed when the one before it is complete.</p>
              </div>

              <div>
                <Label>3. Organs per system</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(catalog?.per_system ?? [2, 3, 4]).map((n) => <button key={n} type="button" className={`${choice(perSystem === n)} text-center`} onClick={() => setPerSystem(n)}>{n}</button>)}
                </div>
                <p className="mt-1 text-xs text-muted">Every team&apos;s patient has {organCount} organs to put back.</p>
                {enoughSystems < systemCount && <p className="mt-1 text-xs font-bold text-bad">Only {enoughSystems} systems have {perSystem} organs so far. Pick fewer, or add organs on the Submit page.</p>}
              </div>

              {emptyTeams.length > 0 && <p className="text-sm font-bold text-bad">Every team needs at least one student. Still empty: {emptyTeams.map(teamLabel).join(', ')}.</p>}
              <Button className="w-full" disabled={busy || emptyTeams.length > 0 || enoughSystems < systemCount} onClick={start}>
                {busy ? 'Starting…' : `🚑 Start the chaos (${systemCount} systems, ${organCount} organs)`}
              </Button>
            </div>
          )}
        </Panel>

        <Panel className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-accent">Students waiting</h2>
            <Button variant="outline" className="!px-4 !py-2 text-sm" disabled={!finalized || waiting.length === 0 || busy} onClick={() => studentAction({ action: 'assign_random' })}>🎲 Randomly assign teams ({waiting.length})</Button>
          </div>
          {!session && <p className="mt-4 text-muted">Create the game first, then students can join with the code.</p>}
          {session && !finalized && <p className="mt-4 text-muted">Finalize the teams so you can put students on them.</p>}
          {session && players.length === 0 && <p className="mt-4 text-muted">No students have joined yet.</p>}
          {waiting.length > 0 && (
            <ul className="mt-4 space-y-2">
              {waiting.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-panel px-3 py-2">
                  <span className="font-bold">{p.display_name}</span>
                  <span className="flex flex-wrap gap-2">
                    {teamNames.map((_, i) => (
                      <button key={i} type="button" disabled={!finalized || busy} onClick={() => studentAction({ action: 'approve_player', player_id: p.id, team_index: i })}
                        className="rounded-xl px-3 py-1 text-sm font-bold text-white disabled:opacity-40" style={{ background: TEAM_COLORS[i] }}>{teamLabel(i)}</button>
                    ))}
                    <button type="button" disabled={busy} onClick={() => studentAction({ action: 'remove_player', player_id: p.id })} className="rounded-xl border border-line px-3 py-1 text-sm font-bold hover:bg-hover">Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {players.some((p) => p.approval_status === 'approved') && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {teamNames.map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-line bg-panel">
                  <div className="h-1.5" style={{ background: TEAM_COLORS[i] }} />
                  <div className="p-3">
                    <p className="font-display font-semibold">{teamLabel(i)}</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {players.filter((p) => p.approval_status === 'approved' && p.team_index === i).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2">
                          <span>{p.display_name}</span>
                          <button type="button" aria-label={`Remove ${p.display_name}`} disabled={busy} onClick={() => studentAction({ action: 'remove_player', player_id: p.id })} className="text-xs font-bold text-bad">✕</button>
                        </li>
                      ))}
                      {sizes[i] === 0 && <li className="text-xs font-bold text-bad">Needs a student</li>}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </main>
  )
}
