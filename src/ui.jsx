// Shared building blocks with the ER look: clean white cards on scrub mint, and dark patient monitors

export function CenterCard({ title, children }) {
  return (
    <main className="er-bg flex min-h-dvh items-center justify-center p-4 text-ink">
      <div className="soft-shadow w-full max-w-md rounded-3xl border border-line bg-card p-8 text-center">
        <h1 className="font-display text-4xl font-bold text-accent"><ChaosTitle text={title} /></h1>
        {children}
      </div>
    </main>
  )
}

// The title with its letters knocked a little out of place (the "chaos")
export function ChaosTitle({ text }) {
  return <span className="chaos" aria-label={text}>{[...text].map((ch, i) => <span key={i} aria-hidden="true">{ch === ' ' ? ' ' : ch}</span>)}</span>
}

export function Label({ children, className = '' }) {
  return <p className={`font-display text-xs font-semibold uppercase tracking-[0.2em] text-info ${className}`}>{children}</p>
}

const BUTTONS = {
  primary: 'bg-accent text-on-accent hover:brightness-110',
  danger: 'bg-bad text-white hover:brightness-110',
  outline: 'border border-line bg-card text-ink hover:bg-hover',
  chaos: 'bg-info text-white hover:brightness-110',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`rounded-2xl px-6 py-3 font-display text-lg font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${BUTTONS[variant]} ${className}`}
      {...props}
    />
  )
}

export function Panel({ children, className = '' }) {
  return <section className={`soft-shadow rounded-3xl border border-line bg-card p-5 ${className}`}>{children}</section>
}

// The patient's heartbeat: a green ECG line that beats faster as vitals drop, and flatlines at 0
export function Ecg({ vitals = 100, className = '' }) {
  const flat = vitals <= 0
  const color = vitals > 60 ? '#39ff8f' : vitals > 30 ? '#facc15' : '#fb7185'
  const beat = `${Math.max(0.6, 1.6 * (vitals / 100) + 0.4)}s`
  return (
    <svg viewBox="0 0 300 60" className={`w-full ${className}`} preserveAspectRatio="none" aria-hidden="true">
      <path
        d={flat ? 'M0 30 H300' : 'M0 30 H40 L50 30 L58 12 L66 48 L74 6 L82 34 L90 30 H150 L160 30 L168 12 L176 48 L184 6 L192 34 L200 30 H300'}
        fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
        className={flat ? '' : 'ecg-line'} style={{ color, '--beat': beat }}
      />
    </svg>
  )
}

// A patient monitor: vitals number, heartbeat and a label
export function Monitor({ vitals, label = 'VITALS', className = '' }) {
  const color = vitals > 60 ? 'text-ecg' : vitals > 30 ? 'text-yellow-300' : 'text-rose-400'
  return (
    <div className={`monitor rounded-2xl p-3 ${className}`}>
      <div className="flex items-baseline justify-between font-display">
        <span className="text-xs font-semibold tracking-[0.25em] text-ecg/70">{label}</span>
        <span className={`text-3xl font-bold ${color}`}>{vitals}<span className="text-base">%</span></span>
      </div>
      <Ecg vitals={vitals} className="mt-1 h-10" />
      {vitals <= 0 && <p className="text-center font-display text-sm font-bold text-rose-400">FLATLINE! Careful!</p>}
    </div>
  )
}
