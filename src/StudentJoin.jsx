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

// The phone: join, wait for a team, then hold your organ cards and put each one in its body system.
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
          <input className={`${field} mt-2`} maxLength={40} placeholder="Maria G." value={name} onChange={(e) => setName(e.target.value)} required />
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
  const [picked, setPicked] = useState(null) // the card being placed (shows the system picker)
  const [flash, setFlash] = useState(null) // { kind: 'right' | 'wrong' | 'bonus' | 'done' | 'info', text, at }
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
        else if (e.kind === 'bonus') playBonus()
        else playPlace()
        if (!ownPlay.current && !e.mine) {
          if (e.kind === 'reject') say('wrong', `🚨 ${e.by}'s organ was rejected by the ${e.system} system. Vitals dropping!`)
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

  async function place(card, system) {
    setBusy(true)
    setError('')
    try {
      ownPlay.current = true
      const r = await ocPlay({ action: 'place', player_id: saved.playerId, device_id: deviceId(), organ_id: card.id, system })
      setPicked(null)
      if (r.finished) say('done', `🎉 That was the last one! Your patient is rebuilt${r.rank ? ` (#${r.rank} to finish)` : ''}.`)
      else if (r.bonus && r.correct) say('bonus', `⭐ Bonus! It's ${r.system} too. +15`)
      else if (r.bonus) say('info', `Not ${r.system}. Bonus lost, but no harm done.`)
      else if (r.bonus_next) say('bonus', `✅ Right! ${r.system}. ⭐ This one does double duty: it belongs to one more system. Place it again for a bonus!`)
      else if (r.correct) say('right', `✅ Right! The ${r.organ} goes in the ${r.system} system.`)
      else say('wrong', `🚨 Rejected! Not the ${r.system} system. Vitals ${r.vitals}%.${r.hint_now ? ' Look at the hint on the card.' : ' Talk it over with your team.'}`)
      await check()
    } catch (e) {
      ownPlay.current = false
      setError(e.message)
      setPicked(null)
      check()
    } finally {
      setBusy(false)
    }
  }

  async function skipBonus(card) {
    setBusy(true)
    try {
      await ocPlay({ action: 'skip_bonus', player_id: saved.playerId, device_id: deviceId(), organ_id: card.id })
      await check()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!view) return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">{error || 'Connecting…'}</p></CenterCard>
  const { player, teams, patient } = view
  const myTeam = teams[player.team_index]
  const cards = view.my_cards ?? []
  let body

  if (player.approval_status !== 'approved') body = <Note title="Almost in!" text="Your leader will put you on a team in a moment." />
  else if (view.game.status === 'setup') body = <Note title={`You're on ${myTeam?.name ?? 'a team'}`} text="Scrub in: the game starts soon." />
  else if (!patient) body = <Note title="Waiting for the patient…" text="" />
  else if (view.game.status === 'finished') body = <Note title="Game over!" text={`${myTeam?.name}: ${patient.points} points · ${patient.placed}/${patient.total} organs back · vitals ${patient.vitals}%.`} />
  else if (patient.finished) body = <Note title="🎉 Patient rebuilt!" text={`Nice teamwork. ${patient.points} points. Waiting for the other teams…`} />
  else {
    body = (
      <>
        <section className="soft-shadow rounded-3xl border border-line bg-card p-4">
          <Monitor vitals={patient.vitals} label="YOUR PATIENT" />
          <div className="mt-3 flex justify-between text-sm font-semibold"><span>Organs back</span><span>{patient.placed}/{patient.total}</span></div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(100 * patient.placed) / patient.total}%` }} /></div>
        </section>

        <section>
          <Label>Your cards (only you can see these)</Label>
          {cards.length === 0 ? (
            <p className="mt-2 rounded-2xl border border-dashed border-line bg-card p-4 text-center text-muted">Your hands are empty! Help your teammates figure out where theirs go.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {cards.map((card) => (
                <li key={card.id}>
                  <button type="button" disabled={busy} onClick={() => setPicked(card)}
                    className={`w-full rounded-2xl border-2 bg-card p-4 text-left transition hover:bg-hover active:scale-[0.99] disabled:opacity-50 ${card.bonus ? 'border-warn' : 'border-accent'}`}>
                    {card.bonus && <span className="mb-1 block font-display text-xs font-semibold uppercase tracking-widest text-warn">⭐ Bonus card · already in {card.placed_in.join(', ')}</span>}
                    <span className={`block font-semibold ${card.kind === 'name' ? 'font-display text-2xl' : 'text-lg'}`}>{card.text}</span>
                    {card.hint && <span className="mt-1 block text-sm text-info">💡 {card.kind === 'name' ? 'What it does: ' : 'It\'s the: '}{card.hint}</span>}
                    {card.misses > 0 && !card.bonus && <span className="mt-1 block text-xs font-bold text-bad">Rejected {card.misses} time{card.misses === 1 ? '' : 's'}</span>}
                    <span className="mt-1 block font-display text-xs font-semibold uppercase tracking-widest text-accent">{card.bonus ? 'Tap: which OTHER system?' : 'Tap to place it'}</span>
                  </button>
                  {card.bonus && <button type="button" disabled={busy} onClick={() => skipBonus(card)} className="mt-1 w-full text-center text-xs font-bold text-muted hover:text-ink">Not sure? Skip the bonus</button>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-center text-xs text-muted">Wrong system = rejection: the card comes back and your patient&apos;s vitals drop. Talk it over first!</p>
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
          <p key={flash.at} className={`pop rounded-2xl px-4 py-3 font-semibold ${flash.kind === 'wrong' ? 'reject bg-bad-soft text-bad' : flash.kind === 'bonus' ? 'bg-warn-soft text-warn' : flash.kind === 'done' || flash.kind === 'right' ? 'bg-ok-soft text-ok' : 'bg-info-soft text-info'}`}>{flash.text}</p>
        )}
        {body}
        {error && <p className="text-center font-bold text-bad">{error}</p>}
        <p className="text-center"><button onClick={() => onLeave()} className="text-sm text-muted hover:text-ink">Leave game</button></p>
      </div>

      {picked && (
        <SystemPicker card={picked} systems={view.game.systems} busy={busy} onPick={(s) => place(picked, s)} onClose={() => setPicked(null)} />
      )}
    </main>
  )
}

// A sheet of the game's body systems: tap one to place the card there
function SystemPicker({ card, systems, busy, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" aria-label="Choose a body system">
      <div className="pop max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-4 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label>{card.bonus ? 'Which OTHER system?' : 'Which body system?'}</Label>
            <p className={`mt-1 font-semibold ${card.kind === 'name' ? 'font-display text-2xl' : ''}`}>{card.text}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cancel" className="rounded-full px-3 py-1 text-lg font-bold text-muted hover:bg-hover">✕</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {systems.map((s) => {
            const info = systemInfo(s.id)
            const already = card.placed_in?.includes(s.name)
            return (
              <button key={s.id} type="button" disabled={busy || already} onClick={() => onPick(s.id)}
                className="flex items-center gap-2 rounded-2xl border-2 bg-panel px-3 py-3 text-left font-display text-base font-semibold transition hover:brightness-95 active:scale-[0.98] disabled:opacity-30"
                style={{ borderColor: info.color }}>
                <span className="text-2xl">{info.emoji}</span>
                <span className="leading-tight">{s.name}{already ? ' ✓' : ''}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
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
