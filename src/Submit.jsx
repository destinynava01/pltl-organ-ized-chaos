import { useEffect, useState } from 'react'
import { ocOrgans } from './api'
import { SYSTEMS } from './config'
import { Button, Label, Panel } from './ui'

const field = 'w-full rounded-2xl border border-line bg-panel px-3 py-2 text-ink outline-none placeholder:text-muted focus:border-accent'

// The public form: an organ (or part) is a name, what it does, and the body system it belongs to (or two, if it
// really does double duty). Reviewers approve it before it's used in a game.
export default function Submit() {
  const [systems, setSystems] = useState(null) // the systems with the organs already in each
  const [name, setName] = useState('')
  const [fn, setFn] = useState('')
  const [picked, setPicked] = useState([])
  const [who, setWho] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => { ocOrgans({ action: 'systems' }).then((d) => setSystems(d.systems)).catch((e) => setError(e.message)) }, [])

  const toggle = (id) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : picked.length >= 2 ? [picked[1], id] : [...picked, id])
  const nameInFunction = name.trim().length > 2 && fn.toLowerCase().includes(name.trim().toLowerCase())

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await ocOrgans({ action: 'submit', name, function: fn, systems: picked, submitter_name: who, submitter_note: note })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <main className="er-bg flex min-h-dvh items-center justify-center p-4 text-ink">
        <Panel className="w-full max-w-md text-center">
          <p className="text-5xl">🩺</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ok">Thanks!</h1>
          <p className="mt-2">&ldquo;{name}&rdquo; was sent to the reviewers. Once it&apos;s approved, it can show up in games.</p>
          <Button className="mt-6 w-full" onClick={() => { setDone(false); setName(''); setFn(''); setPicked([]) }}>Submit another</Button>
          <a href="/" className="mt-3 block text-sm font-bold text-info">← Back to the game</a>
        </Panel>
      </main>
    )
  }

  return (
    <main className="er-bg min-h-dvh px-4 py-8 text-ink">
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
        <a href="/" className="text-sm font-bold text-info hover:underline">← Back to the game</a>
        <header className="text-center">
          <h1 className="font-display text-4xl font-bold text-accent">Submit an organ</h1>
          <p className="mt-2 text-muted">
            Any organ or body part works. Level 1 cards show its <b className="text-ink">name</b>; levels 2 and 3 show only
            <b className="text-ink"> what it does</b>, so write the function without the name.
          </p>
        </header>

        <Panel className="space-y-3">
          <div>
            <Label>Name</Label>
            <input className={`${field} mt-1`} maxLength={60} placeholder="Gallbladder" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>What it does (the level 2 card)</Label>
            <textarea className={`${field} mt-1`} rows={2} maxLength={200} placeholder="Small sac that stores bile and squeezes it into the small intestine" value={fn} onChange={(e) => setFn(e.target.value)} required />
            {nameInFunction && <p className="mt-1 text-sm font-bold text-bad">Leave the name out of the function, or level 2 cards give it away.</p>}
          </div>
        </Panel>

        <Panel>
          <Label>Body system ({picked.length}/2)</Label>
          <p className="mt-1 text-sm text-muted">Pick one. Pick a second only if it truly belongs to both (like the pancreas: digestive and endocrine); those show up in level 3.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SYSTEMS.map((s) => {
              const on = picked.includes(s.id)
              const count = systems?.find((x) => x.id === s.id)?.organs.length
              return (
                <button key={s.id} type="button" onClick={() => toggle(s.id)}
                  className={`rounded-2xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${on ? 'bg-accent-soft' : 'bg-panel hover:bg-hover'}`}
                  style={{ borderColor: on ? s.color : 'transparent' }}>
                  {s.emoji} {s.name}
                  {count !== undefined && <span className="block text-xs font-normal text-muted">{count} already</span>}
                </button>
              )
            })}
          </div>
          {picked.length > 0 && systems && (
            <p className="mt-3 text-xs text-muted">Already in {SYSTEMS.find((s) => s.id === picked[0])?.name}: {systems.find((x) => x.id === picked[0])?.organs.join(', ') || 'nothing yet'}</p>
          )}
        </Panel>

        <Panel className="space-y-3">
          <input className={field} maxLength={80} placeholder="Your name (so reviewers can follow up)" value={who} onChange={(e) => setWho(e.target.value)} required />
          <textarea className={field} rows={2} maxLength={500} placeholder="Note for the reviewer (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button className="w-full" disabled={busy || !name.trim() || fn.trim().length < 10 || picked.length === 0 || !who.trim() || nameInFunction}>
            {busy ? 'Sending…' : 'Send for review'}
          </Button>
          {error && <p className="font-bold text-bad">{error}</p>}
        </Panel>
      </form>
    </main>
  )
}
