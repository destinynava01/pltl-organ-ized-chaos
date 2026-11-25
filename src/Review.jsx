import { useCallback, useEffect, useState } from 'react'
import { ocReview } from './api'
import { SYSTEMS, systemInfo } from './config'
import { SignIn, SignInCard } from './SignIn'
import { supabase } from './supabase'
import { useSession } from './useSession'
import { Button } from './ui'

const field = 'w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent'
const TABS = [{ id: 'pending', label: 'Waiting' }, { id: 'approved', label: 'Approved' }, { id: 'rejected', label: 'Rejected' }]

// Reviewers: approve, edit or reject submitted organs (same sign-in as the other game sites)
export default function Review() {
  const session = useSession()
  if (session === undefined) return <SignInCard><p className="p-8 text-center text-muted">Checking access…</p></SignInCard>
  return session ? <Reviewer key={session.user.id} /> : <SignIn />
}

function Reviewer() {
  const [tab, setTab] = useState('pending')
  const [data, setData] = useState(null)
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [picked, setPicked] = useState([])
  const [filter, setFilter] = useState('')

  const load = useCallback(() => ocReview({ action: 'list', status: tab }).then((d) => { setData(d); setPicked([]); setError('') }).catch((e) => setError(e.message)), [tab])
  useEffect(() => { ocReview({ action: 'whoami' }).then(setMe).catch((e) => setError(e.message)) }, [])
  useEffect(() => { load() }, [load])

  async function act(payload, done) {
    setError('')
    try {
      const r = await ocReview(payload)
      setMessage(done ?? r.message ?? '')
      await load()
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  if (error && !me) {
    return (
      <SignInCard>
        <div className="p-6 text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-3">{error}</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-4 font-bold text-info">Sign out</button>
        </div>
      </SignInCard>
    )
  }

  const list = (data?.organs ?? []).filter((o) => !filter || o.systems.includes(filter))
  return (
    <main className="er-bg min-h-dvh px-4 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a href="/" className="text-sm font-bold text-info hover:underline">← Back to the game</a>
          <p className="text-sm text-muted">{me?.email} · <button onClick={() => supabase.auth.signOut()} className="font-bold text-info">Sign out</button></p>
        </div>
        <header className="mt-2 text-center">
          <h1 className="font-display text-4xl font-bold text-accent">Organ Review</h1>
          <p className="mt-1 text-muted">An organ goes into games once it&apos;s approved. <a href="/submit" className="font-bold text-info">+ Submit new</a></p>
        </header>

        <nav className="mt-6 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setMessage('') }}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${tab === t.id ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-card hover:bg-hover'}`}>
              {t.label} <span className="ml-1 text-xs opacity-80">{data?.counts?.[t.id]}</span>
            </button>
          ))}
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-auto rounded-xl border border-line bg-card px-3 py-2 text-sm font-semibold" aria-label="Show one body system">
            <option value="">All systems</option>
            {SYSTEMS.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
          </select>
          {tab === 'pending' && list.length > 0 && (
            <>
              <button onClick={() => setPicked(picked.length === list.length ? [] : list.map((s) => s.id))} className="text-sm font-bold text-info">{picked.length === list.length ? 'Clear selection' : `Select all ${list.length}`}</button>
              {picked.length > 0 && <Button className="!px-3 !py-1.5 text-sm" onClick={() => act({ action: 'set_status', ids: picked, status: 'approved' })}>✓ Approve {picked.length}</Button>}
            </>
          )}
        </nav>
        {message && <p className="mt-3 font-bold text-ok">{message}</p>}
        {error && <p className="mt-3 font-bold text-bad">{error}</p>}
        {!data && <p className="mt-6 text-muted">Loading…</p>}
        {data && list.length === 0 && <p className="mt-6 text-muted">Nothing here.</p>}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {list.map((o) => <OrganCard key={o.id} o={o} picked={picked.includes(o.id)} onPick={() => setPicked((x) => (x.includes(o.id) ? x.filter((y) => y !== o.id) : [...x, o.id]))} tab={tab} act={act} />)}
        </ul>
      </div>
    </main>
  )
}

function OrganCard({ o, picked, onPick, tab, act }) {
  const [draft, setDraft] = useState(null)
  const save = async () => {
    const ok = await act({ action: 'save', id: o.id, name: draft.name, function: draft.function, systems: draft.systems }, 'Saved.')
    if (ok) setDraft(null)
  }
  if (draft) {
    const toggle = (id) => setDraft({ ...draft, systems: draft.systems.includes(id) ? draft.systems.filter((x) => x !== id) : [...draft.systems, id].slice(-2) })
    return (
      <li className="rounded-2xl border border-accent bg-card p-4 sm:col-span-2">
        <input className={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Name" />
        <textarea className={`${field} mt-2`} rows={2} value={draft.function} onChange={(e) => setDraft({ ...draft, function: e.target.value })} aria-label="Function" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SYSTEMS.map((s) => (
            <button key={s.id} type="button" onClick={() => toggle(s.id)} className="rounded-full border-2 px-2.5 py-1 text-xs font-bold"
              style={draft.systems.includes(s.id) ? { background: s.color, borderColor: s.color, color: 'white' } : { borderColor: s.color, color: s.color }}>
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button className="!px-4 !py-2 text-sm" onClick={save}>Save</Button>
          <Button variant="outline" className="!px-4 !py-2 text-sm" onClick={() => setDraft(null)}>Cancel</Button>
        </div>
      </li>
    )
  }
  return (
    <li className={`rounded-2xl border bg-card p-4 ${picked ? 'border-accent' : 'border-line'}`}>
      <div className="flex gap-3">
        {tab === 'pending' && <input type="checkbox" checked={picked} onChange={onPick} className="mt-1.5 h-4 w-4 accent-teal-600" aria-label={`Select ${o.name}`} />}
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold">{o.name}</p>
          <p className="mt-1 flex flex-wrap gap-1">
            {o.systems.map((s) => <span key={s} className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: systemInfo(s).color }}>{systemInfo(s).emoji} {systemInfo(s).name}</span>)}
          </p>
          <p className="mt-1 text-sm text-muted">{o.function}</p>
          <p className="mt-2 text-xs text-muted">From {o.submitter_name || 'unknown'}{o.submitter_note ? ` · "${o.submitter_note}"` : ''}{o.reviewed_by ? ` · ${o.status} by ${o.reviewed_by}` : ''}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
            {o.status !== 'approved' && <button onClick={() => act({ action: 'set_status', ids: [o.id], status: 'approved' })} className="rounded-lg bg-accent px-3 py-1 text-on-accent">✓ Approve</button>}
            {o.status !== 'rejected' && <button onClick={() => act({ action: 'set_status', ids: [o.id], status: 'rejected' })} className="rounded-lg border border-bad px-3 py-1 text-bad">✕ Reject</button>}
            {o.status !== 'pending' && <button onClick={() => act({ action: 'set_status', ids: [o.id], status: 'pending' })} className="rounded-lg border border-line px-3 py-1">Back to waiting</button>}
            <button onClick={() => setDraft({ name: o.name, function: o.function, systems: [...o.systems] })} className="rounded-lg border border-info px-3 py-1 text-info">✎ Edit</button>
            {o.status === 'rejected' && <button onClick={() => window.confirm(`Delete "${o.name}" for good?`) && act({ action: 'delete', id: o.id })} className="px-2 py-1 text-bad">Delete</button>}
          </div>
        </div>
      </div>
    </li>
  )
}
