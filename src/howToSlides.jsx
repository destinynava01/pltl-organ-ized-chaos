/* eslint-disable react-refresh/only-export-components -- static slide content with small local helpers */
// The "How to play" slides for Organ-ized Chaos (shown on the projector when the game starts). The art uses the
// same pieces as the real game (the monitor, the cards, the system buttons).
import { Monitor } from './ui'

function Phone({ children }) {
  return <div className="w-60 rounded-[1.6rem] border-4 border-slate-700 bg-board p-3 text-ink shadow-xl">{children}</div>
}
function Card({ children, bonus = false }) {
  return <div className={`rounded-2xl border-2 bg-card p-3 text-left ${bonus ? 'border-warn' : 'border-accent'}`}>{children}</div>
}
function SystemButton({ emoji, name, color, picked = false }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-xl border-2 bg-panel px-2 py-1.5 text-sm font-display font-semibold ${picked ? 'ring-4 ring-accent/40' : ''}`} style={{ borderColor: color }}>
      <span className="text-lg">{emoji}</span>{name}
    </div>
  )
}

export const SLIDES = [
  {
    title: 'The patient is a mess',
    text: 'Every team gets the same patient, and all of its organs got mixed up. Your job: put every organ back in the right body system before the other teams do.',
    art: (
      <div className="w-full max-w-xs space-y-3">
        <Monitor vitals={100} label="YOUR PATIENT" />
        <div className="flex flex-wrap justify-center gap-2 text-2xl">
          {['🫀', '🫁', '🧠', '🦴', '🦷', '💪'].map((e, i) => <span key={i} className="rounded-xl bg-card p-2 shadow" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (8 + i * 3)}deg)` }}>{e}</span>)}
        </div>
      </div>
    ),
  },
  {
    title: 'Organ cards on your phone',
    text: 'The organs are dealt to your team\'s phones. Only you see your cards. Level 1 cards show the organ\'s name; levels 2 and 3 show only what it does.',
    art: (
      <Phone>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-info">Your cards</p>
        <div className="mt-2 space-y-2">
          <Card><p className="font-display text-xl font-semibold">Liver</p><p className="text-xs font-semibold uppercase tracking-widest text-accent">Tap to place it</p></Card>
          <Card><p className="text-sm font-semibold">Tiny air sacs where gas exchange happens</p><p className="text-xs font-semibold uppercase tracking-widest text-accent">Tap to place it</p></Card>
        </div>
      </Phone>
    ),
  },
  {
    title: 'Pick its body system',
    text: 'Talk it over with your team, tap a card, then tap the system it belongs to. Right system: the organ is back in the patient. Teams don\'t take turns; anyone can play any time.',
    art: (
      <Phone>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-info">Which body system?</p>
        <p className="font-display text-xl font-semibold">Liver</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <SystemButton emoji="❤️" name="Cardio" color="#e11d48" />
          <SystemButton emoji="🍽️" name="Digestive" color="#ca8a04" picked />
          <SystemButton emoji="🫁" name="Respiratory" color="#2563eb" />
          <SystemButton emoji="💧" name="Urinary" color="#0284c7" />
        </div>
      </Phone>
    ),
  },
  {
    title: 'Wrong system? Rejected!',
    text: 'A wrong system is a rejection: the card comes back to you and your patient\'s vitals drop. Miss the same card twice and it shows a hint (the name, or what it does).',
    art: (
      <div className="w-full max-w-xs space-y-3">
        <p className="reject rounded-2xl bg-bad-soft px-4 py-3 font-semibold text-bad">🚨 Rejected! Not the Respiratory system. Vitals 80%.</p>
        <Monitor vitals={80} label="YOUR PATIENT" />
        <Card><p className="text-sm font-semibold">Makes bile and removes toxins from the blood</p><p className="mt-1 text-sm text-info">💡 It&apos;s the: Liver</p></Card>
      </div>
    ),
  },
  {
    title: 'Level 3: double duty',
    text: 'Some organs belong to two systems, like the pancreas (digestive AND endocrine). Either one counts. Then the card stays in your hand: place it in its other system for a bonus.',
    art: (
      <Phone>
        <Card bonus>
          <p className="text-xs font-semibold uppercase tracking-widest text-warn">⭐ Bonus card · already in Digestive</p>
          <p className="text-sm font-semibold">Releases insulin to control blood sugar, and enzymes that digest food</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Tap: which OTHER system?</p>
        </Card>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <SystemButton emoji="🧪" name="Endocrine" color="#7c3aed" picked />
          <SystemButton emoji="🧠" name="Nervous" color="#db2777" />
        </div>
      </Phone>
    ),
  },
  {
    title: 'Stabilize your patient first',
    text: 'Every organ back = 10 points, a bonus = 15. Rebuild your patient first for a big finish bonus, plus the vitals you have left. Fewer rejections, more points!',
    art: (
      <div className="w-64 space-y-2">
        {[['🥇 Team 2', 290, '#16a34a'], ['🥈 Team 1', 245, '#2563eb']].map(([n, p, c]) => (
          <p key={n} className="flex justify-between rounded-2xl border border-line bg-card px-4 py-3 font-display text-lg font-semibold" style={{ borderLeft: `8px solid ${c}` }}><span>{n}</span><span className="text-accent">{p}</span></p>
        ))}
      </div>
    ),
  },
]

// The guide's own look (the ER: a white chart card with a teal header stripe, a monitor-dark art box, Fredoka
// lettering). HowToPlay.jsx reads this; anything left out uses its plain dark look.
export const SKIN = {
  backdrop: 'bg-[#0f2a2e]/70',
  panel: 'rounded-3xl border border-line bg-card text-ink shadow-2xl before:block before:h-2 before:content-[\'\'] before:bg-[linear-gradient(90deg,#0f8b7d,#6d28d9,#e11d48)]',
  glow: false,
  label: 'font-display text-sm font-semibold uppercase tracking-[0.25em] text-info',
  skip: 'rounded-full border border-line bg-panel px-3 py-1 text-sm font-bold text-muted hover:bg-hover',
  art: 'er-bg rounded-2xl border border-line',
  step: 'text-sm font-bold uppercase tracking-widest text-muted',
  title: 'font-display text-3xl font-bold leading-tight text-accent sm:text-4xl',
  text: 'text-lg leading-relaxed text-ink',
  footer: 'border-t border-line bg-panel',
  check: 'text-sm text-muted',
  back: 'rounded-xl border border-line bg-card px-4 py-2 font-bold text-ink hover:bg-hover',
  next: 'rounded-xl bg-accent px-5 py-2 font-display text-lg font-semibold text-on-accent hover:brightness-110',
  dotOff: '#c6dcd8',
  launcher: 'rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-accent shadow-lg hover:bg-hover',
}
