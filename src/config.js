// Change these to rebrand the game.
export const SITE_NAME = 'Organ-ized Chaos'
export const SITE_TAGLINE = 'The organs got mixed up. Put the patient back together!'
export const HUB_URL = 'https://pltl-game-hub.vercel.app'

export const MIN_TEAMS = 1
export const MAX_TEAMS = 8
export const TEAM_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

// The 11 body systems (ids match the server's _shared/organized.ts)
export const SYSTEMS = [
  { id: 'integumentary', name: 'Integumentary', emoji: '🖐️', color: '#f59e0b' },
  { id: 'skeletal', name: 'Skeletal', emoji: '🦴', color: '#78716c' },
  { id: 'muscular', name: 'Muscular', emoji: '💪', color: '#dc2626' },
  { id: 'nervous', name: 'Nervous', emoji: '🧠', color: '#db2777' },
  { id: 'endocrine', name: 'Endocrine', emoji: '🧪', color: '#7c3aed' },
  { id: 'cardiovascular', name: 'Cardiovascular', emoji: '❤️', color: '#e11d48' },
  { id: 'lymphatic', name: 'Lymphatic & immune', emoji: '🛡️', color: '#0891b2' },
  { id: 'respiratory', name: 'Respiratory', emoji: '🫁', color: '#2563eb' },
  { id: 'digestive', name: 'Digestive', emoji: '🍽️', color: '#ca8a04' },
  { id: 'urinary', name: 'Urinary', emoji: '💧', color: '#0284c7' },
  { id: 'reproductive', name: 'Reproductive', emoji: '🧬', color: '#9333ea' },
]
export const systemInfo = (idOrName) => SYSTEMS.find((s) => s.id === idOrName || s.name === idOrName) ?? { name: idOrName, emoji: '❔', color: '#64748b' }

export const LEVELS = [
  { id: 1, name: 'Names', text: 'Cards show the organ\'s name ("Liver").' },
  { id: 2, name: 'Functions', text: 'Cards show only what it does ("Makes bile and removes toxins").' },
  { id: 3, name: 'Functions + double duty', text: 'Functions, plus organs in two systems (like the pancreas), which are needed in both.' },
]
