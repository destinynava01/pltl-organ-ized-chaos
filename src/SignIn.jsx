import { useState } from 'react'
import { callFunction } from './api'
import { supabase } from './supabase'


const UTRGV_EMAIL = /^[^@\s]+@utrgv\.edu$/i
const input =
  'w-full rounded-xl border-2 border-line bg-panel px-4 py-3 text-lg text-ink outline-none placeholder:text-muted focus:border-accent'
const button = 'w-full rounded-xl px-5 py-3 font-display text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-40'

export function SignInCard({ children }) {
  return (
    <main className="er-bg flex min-h-dvh flex-col items-center justify-center px-4 py-8 text-ink">
      <div className="w-full max-w-md">
        <a href="/" className="mb-4 inline-block text-sm font-bold text-info hover:brightness-125">← Back to the game</a>
        <div className="soft-shadow overflow-hidden rounded-3xl border border-line bg-card">
          
          <header className="px-6 pt-6 text-center">
            <p className="font-display text-xs uppercase tracking-[0.4em] text-bad">● Reviewers only</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-accent">Organ Review</h1>
            <p className="mt-1 font-display text-sm uppercase tracking-[0.3em] text-info">Organ-ized Chaos</p>
          </header>
          {children}
        </div>
      </div>
    </main>
  )
}

export function SignIn() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendLink(event) {
    event.preventDefault()
    setError('')
    const clean = email.trim().toLowerCase()
    if (!UTRGV_EMAIL.test(clean)) return setError('Use your @utrgv.edu email address.')

    setBusy(true)
    try {
      const access = await callFunction('review-access', { email: clean }, 'Could not check your reviewer access.')
      if (!access.authorized) {
        setBusy(false)
        return setError('This email is not authorized to review. Ask the supervisor to add it.')
      }
    } catch (e) {
      setBusy(false)
      return setError(e.message)
    }

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: `${window.location.origin}/review` },
    })
    setBusy(false)
    if (sendError) return setError(sendError.message)
    setEmail(clean)
    setSent(true)
  }

  // For when the email is opened on a different device than this one
  async function verifyCode(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (verifyError) setError(verifyError.message)
  }

  return (
    <SignInCard>
      <div className="p-6">
        {!sent ? (
          <form onSubmit={sendLink} className="space-y-4">
            <p className="text-center text-muted">Reviewers sign in with their UTRGV email. We&apos;ll email you a sign-in link, so there&apos;s no password.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@utrgv.edu" aria-label="Your UTRGV email" required className={input} />
            <button type="submit" disabled={busy} className={`${button} bg-accent text-on-accent hover:opacity-90`}>
              {busy ? 'Checking…' : '🩺 Email me a sign-in link'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="text-center text-4xl">📬</div>
            <p className="text-center">Check <span className="font-bold text-info">{email}</span> and click the sign-in link.</p>
            <p className="text-center text-sm text-muted">Opened it on another device? Enter the code from the email instead:</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" aria-label="6-digit code"
              inputMode="numeric" autoComplete="one-time-code" className={`${input} text-center text-2xl tracking-[0.5em]`} />
            <button type="submit" disabled={busy || code.trim().length < 6} className={`${button} bg-ok text-white hover:brightness-110`}>
              {busy ? 'Checking…' : 'Sign in with code'}
            </button>
            <button type="button" onClick={() => { setSent(false); setCode('') }} className="w-full text-sm font-bold text-info hover:brightness-125">
              Use a different email
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="reject mt-4 rounded-xl border-2 border-bad bg-bad-soft p-2 text-center text-sm font-bold text-bad">⛔ {error}</p>
        )}
      </div>
    </SignInCard>
  )
}
