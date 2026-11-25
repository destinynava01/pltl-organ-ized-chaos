// Organ-ized Chaos sound effects, made with the browser's Web Audio API (no audio files). Browsers allow sound only
// after someone has tapped or clicked the page, which has happened by the time a game is running.

const SOUND_KEY = 'organizedChaosSound'
let audio = null

function context() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audio) audio = new Ctx()
  if (audio.state === 'suspended') audio.resume().catch(() => {})
  return audio
}

export function soundOn() {
  try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true }
}
export function setSoundOn(on) {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off') } catch { /* storage blocked */ }
}

function tone(ctx, { from, to = from, start = 0, length = 0.2, type = 'sine', volume = 0.15 }) {
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + length)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + length + 0.05)
}

const play = (fn) => () => {
  if (!soundOn()) return
  const ctx = context()
  if (ctx) fn(ctx)
}

// 💓 An organ back in place: the monitor's healthy double beep
export const playPlace = play((ctx) => {
  tone(ctx, { from: 880, length: 0.09, volume: 0.12 })
  tone(ctx, { from: 880, start: 0.14, length: 0.09, volume: 0.12 })
})

// 🚨 A rejection: a falling alarm, twice
export const playReject = play((ctx) => {
  ;[0, 0.28].forEach((start) => tone(ctx, { from: 740, to: 370, start, length: 0.24, type: 'square', volume: 0.09 }))
})

// ⭐ A bonus: a bright two-note sparkle
export const playBonus = play((ctx) => {
  tone(ctx, { from: 988, start: 0, length: 0.14, type: 'triangle', volume: 0.14 })
  tone(ctx, { from: 1319, start: 0.1, length: 0.25, type: 'triangle', volume: 0.14 })
})

// 🎉 The patient is rebuilt: a rising fanfare
export const playFinish = play((ctx) => {
  ;[523, 659, 784, 1047].forEach((f, i) => tone(ctx, { from: f, start: i * 0.1, length: 0.4, type: 'triangle', volume: 0.14 }))
})
