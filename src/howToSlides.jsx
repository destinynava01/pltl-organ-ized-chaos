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
export const SLIDES = [
  {
    title: 'The patient is a mess',
    text: 'Every team gets the same patient, and all of its organs got mixed up. Your job: rebuild it, one body system at a time, before the other teams do.',
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
    text: 'The organs, from every system in the game, are dealt at random to your team\'s phones. Only you see your cards. Level 1 cards show the organ\'s name; levels 2 and 3 show only what it does.',
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
    title: 'One system at a time',
    text: 'Your phone shows the system your team is rebuilding now (say, Skeletal). Find the cards that belong to it and play them; keep the rest for later. When it\'s complete, the next system is revealed.',
    art: (
      <Phone>
        <div className="rounded-2xl border-2 bg-card p-2" style={{ borderColor: '#78716c' }}>
          <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-info">Now rebuilding · system 1 of 4</p>
          <p className="font-display text-xl font-bold" style={{ color: '#78716c' }}>🦴 Skeletal</p>
          <p className="text-xs text-muted">Still to come: ? ? ?</p>
        </div>
        <div className="mt-2 space-y-1.5">
          <Card><p className="font-display text-lg font-semibold">Femur</p><p className="mt-1 rounded-lg py-1 text-center text-sm font-semibold text-white" style={{ background: '#78716c' }}>🦴 Play into Skeletal</p></Card>
          <Card><p className="font-display text-lg font-semibold">Liver</p><p className="text-xs text-muted">(not this one: wait for its system)</p></Card>
        </div>
      </Phone>
    ),
  },
  {
    title: 'Wrong system? Rejected!',
    text: 'Play a card that doesn\'t belong to the current system and it\'s a rejection: the card stays in your hand and your patient\'s vitals drop. Miss the same card twice and it shows a hint (the name, or what it does).',
    art: (
      <div className="w-full max-w-xs space-y-3">
        <p className="reject rounded-2xl bg-bad-soft px-4 py-3 font-semibold text-bad">🚨 Rejected! That one isn&apos;t part of the Respiratory system. Vitals 80%.</p>
        <Monitor vitals={80} label="YOUR PATIENT" />
        <Card><p className="text-sm font-semibold">Makes bile and removes toxins from the blood</p><p className="mt-1 text-sm text-info">💡 It&apos;s the: Liver</p></Card>
      </div>
    ),
  },
  {
    title: 'Level 3: double duty',
    text: 'Some organs belong to two systems, like the pancreas (digestive AND endocrine), and the patient needs them in both. Play it when the first of its systems comes up; it stays in your hand until the other one does.',
    art: (
      <Phone>
        <Card bonus>
          <p className="text-xs font-semibold uppercase tracking-widest text-warn">⭐ Double duty · already in Digestive</p>
          <p className="text-sm font-semibold">Releases insulin to control blood sugar, and enzymes that digest food</p>
          <p className="mt-1 rounded-lg py-1 text-center text-sm font-semibold text-white" style={{ background: '#7c3aed' }}>🧪 Play into Endocrine</p>
        </Card>
      </Phone>
    ),
  },
  {
    title: 'Stabilize your patient first',
    text: 'Every organ back = 10 points; every system completed = 25. Rebuild the whole patient first for a big finish bonus, plus the vitals you have left. Fewer rejections, more points!',
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
