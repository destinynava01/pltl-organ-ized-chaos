import { useCallback, useEffect, useRef, useState } from 'react'
import { ocPlay, watchGame } from './api'
import { SITE_NAME, systemInfo } from './config'
import { playBonus, playFinish, playPlace, playReject } from './sounds'
import { Button, CenterCard, Label, Monitor } from './ui'

const STORAGE_KEY = 'organizedChaosStudent'
const DEVICE_KEY = 'organizedChaosDevice'
const field = 'w-full rounded-2xl border border-line bg-panel px-4 py-3 text-center text-xl font-bold text-ink outline-none focus:border-accent'

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id) }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
const readSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null } }
const writeSaved = (v) => { try { v ? localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) : localStorage.removeItem(STORAGE_KEY) } catch { /* blocked */ } }

// The phone: join, wait for a team, then hold your organ cards and play the ones that belong to the body system
// your team is rebuilding now. One system at a time; the next is revealed when the current one is complete.
export default function StudentJoin() {
  const [saved, setSaved] = useState(readSaved)
  const [notice, setNotice] = useState('')
  const leave = useCallback((message = '') => { writeSaved(null); setSaved(null); setNotice(message) }, [])
  return saved ? <Room saved={saved} onLeave={leave} /> : <JoinForm notice={notice} onJoined={(v) => { writeSaved(v); setSaved(v); setNotice('') }} />
}

function JoinForm({ onJoined, notice }) {
  const [code, setCode] = useState(() => (new URLSearchParams(window.location.search).get('code') ?? '').toUpperCase())
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function join(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const d = await ocPlay({ action: 'join', join_code: code, display_name: name, device_id: deviceId() })
      onJoined({ playerId: d.player.id, gameId: d.game.id })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <CenterCard title={SITE_NAME}>
      <p className="mt-2 text-muted">Join your team&apos;s operating room.</p>
      <form onSubmit={join} className="mt-4 space-y-4">
        {notice && <p className="font-bold text-muted">{notice}</p>}
        <div>
          <Label>Game code</Label>
          <input className={`${field} mt-2 uppercase tracking-[0.4em]`} maxLength={6} placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoCapitalize="characters" autoComplete="off" />
        </div>
        <div>
          <Label>Your name</Label>
          <input className={`${field} mt-2`} maxLength={40} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={busy || code.length < 6 || !name.trim()}>{busy ? 'Scrubbing in…' : 'Join'}</Button>
        {error && <p className="font-bold text-bad">{error}</p>}
      </form>
    </CenterCard>
  )
}

function Room({ saved, onLeave }) {
  const [view, setView] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null) // { kind: 'right' | 'wrong' | 'system' | 'done' | 'info', text, at }
  const lastEvent = useRef(null) // the team's last event, to hear and see what teammates did
  const ownPlay = useRef(false) // this phone just played (it already showed its own result)
  const stamp = useRef(0)
  const say = (kind, text) => { stamp.current += 1; setFlash({ kind, text, at: stamp.current }) }

  const check = useCallback(() => ocPlay({ action: 'status', player_id: saved.playerId, device_id: deviceId() })
    .then((d) => {
      if (d.ended) return onLeave('That game has ended. Join another with a new code.')
      // Something happened to the patient: sounds for everyone, a message when it was a teammate
      const e = d.patient?.last_event
      if (e && lastEvent.current && e.at !== lastEvent.current) {
        if (e.kind === 'finish') playFinish()
        else if (e.kind === 'reject') playReject()
        else if (e.kind === 'system') playBonus()
        else playPlace()
        if (!ownPlay.current && !e.mine) {
          if (e.kind === 'reject') say('wrong', `🚨 ${e.by} played a card that isn't ${e.system}. Vitals dropping!`)
          else if (e.kind === 'system') say('system', `✅ ${e.system} complete! Now rebuilding: ${d.patient.current?.name ?? ''}`)
          else if (e.kind === 'finish') say('done', '🎉 The patient is rebuilt!')
        }
      }
      ownPlay.current = false
      lastEvent.current = e?.at ?? lastEvent.current ?? 'none'
      setView(d)
      setError('')
    })
    .catch((err) => {
      if (/not found|another phone/i.test(err.message)) return onLeave('You were removed from that game.')
      setError(err.message)
    }), [saved, onLeave])

  useEffect(() => {
    check()
    return watchGame(saved.gameId, ['state', 'lobby'], check, 4000)
  }, [saved, check])

  async function place(card) {
    setBusy(true)
    setError('')
    try {
      ownPlay.current = true
      const r = await ocPlay({ action: 'place', player_id: saved.playerId, device_id: deviceId(), organ_id: card.id, system: view.patient.current?.id })
      if (r.finished) say('done', `🎉 That was the last one! Your patient is rebuilt${r.rank ? ` (#${r.rank} to finish)` : ''}.`)
      else if (r.system_done) say('system', `✅ ${r.system} complete! Now rebuilding: ${r.next_system}`)
      else if (r.needed_again) say('right', `✅ Yes, it's part of the ${r.system} system. Keep it: it does double duty and is needed in another system later!`)
      else if (r.correct) say('right', `✅ Yes! The ${r.organ} is part of the ${r.system} system.`)
      else say('wrong', `🚨 Rejected! That one isn't part of the ${r.system} system. Vitals ${r.vitals}%.${r.hint_now ? ' Look at the hint on the card.' : ' Keep it for a later system.'}`)
      await check()
    } catch (e) {
      ownPlay.current = false
      setError(e.message)
      check()
    } finally {
      setBusy(false)
    }
  }

  if (!view) return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">{error || 'Connecting…'}</p></CenterCard>
  const { player, teams, patient } = view
  const myTeam = teams[player.team_index]
  const cards = view.my_cards ?? []
  const now = patient?.current ? systemInfo(patient.current.id) : null
  let body

  if (player.approval_status !== 'approved') body = <Note title="Almost in!" text="Your leader will put you on a team in a moment." />
  else if (view.game.status === 'setup') body = <Note title={`You're on ${myTeam?.name ?? 'a team'}`} text="Scrub in: the game starts soon." />
  else if (!patient) body = <Note title="Waiting for the patient…" text="" />
  else if (view.game.status === 'finished') body = <Note title="Game over!" text={`${myTeam?.name}: ${patient.points} points · ${patient.stage}/${patient.stages} systems rebuilt · vitals ${patient.vitals}%.`} />
  else if (patient.finished) body = <Note title="🎉 Patient rebuilt!" text={`Nice teamwork. ${patient.points} points. Waiting for the other teams…`} />
  else {
    body = (
      <>
        {/* Now rebuilding: the current system, the ones done, and "?" for the rest */}
        {now && (
          <section className="soft-shadow rounded-3xl border-2 bg-card p-4" style={{ borderColor: now.color }}>
            <Label>Now rebuilding · system {patient.stage + 1} of {patient.stages}</Label>
            <p className="font-display text-3xl font-bold" style={{ color: now.color }}>{now.emoji} {patient.current.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from({ length: patient.current.total }, (_, k) => (
                <span key={k} className={`h-3.5 w-7 rounded-full ${k < patient.current.placed ? '' : 'border-2 border-dashed border-line'}`} style={k < patient.current.placed ? { background: now.color } : undefined} />
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              {patient.done.length > 0 && <>Done: {patient.done.map((n) => `✓ ${n}`).join(' · ')} · </>}
              Still to come: {Array.from({ length: patient.stages - patient.stage - 1 }, () => '?').join(' ') || 'nothing, this is the last one!'}
            </p>
            <Monitor vitals={patient.vitals} label="YOUR PATIENT" className="mt-3" />
          </section>
        )}

        <section>
          <Label>Your cards (only you can see these)</Label>
          {cards.length === 0 ? (
            <p className="mt-2 rounded-2xl border border-dashed border-line bg-card p-4 text-center text-muted">Your hands are empty! Help your teammates figure out which of theirs belong.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {cards.map((card) => (
                <li key={card.id} className="rounded-2xl border-2 border-line bg-card p-4">
                  {card.placed_in.length > 0 && <span className="mb-1 block font-display text-xs font-semibold uppercase tracking-widest text-warn">⭐ Double duty · already in {card.placed_in.join(', ')}</span>}
                  <span className={`block font-semibold ${card.kind === 'name' ? 'font-display text-2xl' : 'text-lg'}`}>{card.text}</span>
                  {card.hint && <span className="mt-1 block text-sm text-info">💡 {card.kind === 'name' ? 'What it does: ' : 'It\'s the: '}{card.hint}</span>}
                  {card.misses > 0 && <span className="mt-1 block text-xs font-bold text-bad">Rejected {card.misses} time{card.misses === 1 ? '' : 's'}</span>}
                  {now && (
                    <button type="button" disabled={busy} onClick={() => place(card)}
                      className="mt-3 w-full rounded-xl px-3 py-2 font-display text-base font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                      style={{ background: now.color }}>
                      {now.emoji} Play into {patient.current.name}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-center text-xs text-muted">Only play cards that belong to {patient.current?.name ?? 'the current system'}. The rest wait for their system to come up. A wrong card is a rejection and your patient&apos;s vitals drop.</p>
        </section>

        <section className="rounded-2xl border border-line bg-card p-3 text-sm">
          <p className="font-bold">Who has cards</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {(view.hands ?? []).map((h) => <li key={h.name} className="rounded-full bg-panel px-3 py-1">{h.name}: {h.cards}</li>)}
          </ul>
        </section>
      </>
    )
  }

  return (
    <main className="er-bg min-h-dvh text-ink">
      <div className="mx-auto max-w-md space-y-4 p-4">
        <header className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{player.display_name}</p>
            {myTeam && <p className="text-sm text-muted"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: myTeam.color }} />{myTeam.name}</p>}
          </div>
          {patient && <p className="text-right"><span className="font-display text-2xl font-bold text-accent">{patient.points}</span> <span className="text-sm text-muted">pts</span></p>}
        </header>
        {flash && (
          <p key={flash.at} className={`pop rounded-2xl px-4 py-3 font-semibold ${flash.kind === 'wrong' ? 'reject bg-bad-soft text-bad' : flash.kind === 'system' || flash.kind === 'done' || flash.kind === 'right' ? 'bg-ok-soft text-ok' : 'bg-info-soft text-info'}`}>{flash.text}</p>
        )}
        {body}
        {error && <p className="text-center font-bold text-bad">{error}</p>}
        <p className="text-center"><button onClick={() => onLeave()} className="text-sm text-muted hover:text-ink">Leave game</button></p>
      </div>

    </main>
  )
}

function Note({ title, text }) {
  return (
    <section className="soft-shadow rounded-3xl border border-line bg-card p-6 text-center">
      <h2 className="font-display text-2xl font-bold text-accent">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </section>
  )
}
