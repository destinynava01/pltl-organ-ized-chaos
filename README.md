# Organ-ized Chaos

A PLTL review game for body systems. Every team gets a patient whose organs got mixed up; the organs are dealt to
students' phones as cards, and the team puts each one back in the right body system. A wrong system is a
rejection: the card comes back and the patient's vitals drop. The first team to rebuild its patient (with the best
vitals) wins.

- **Level 1:** cards show the organ's name. **Level 2:** cards show only what it does. **Level 3:** functions, plus
  organs that belong to two systems (placing those in both earns a bonus).
- After two misses on the same card, it shows a hint (its other side).
- The projector shows each patient's monitor and how full each body system is (not which organs, so teams can't
  copy each other). The results show the answer key, with the organs the class missed most first.

## Pages

| Path | Who | What |
|---|---|---|
| `/` | Leader | Lobby (teams, level, systems), then the projector board and results |
| `/join` | Students | Join with the code, hold organ cards, place them |
| `/submit` | Anyone | Submit an organ: name, function, its body system (or two) |
| `/review` | Reviewers | Approve, edit or reject submitted organs (same sign-in as the other PLTL sites) |

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the shared PLTL Supabase project's URL and publishable key.
3. `npm run dev`

The backend lives in the shared `supabase-backend` repo: the `oc-game`, `oc-play`, `oc-organs` and `oc-review` Edge
Functions, the rules in `_shared/organized.ts`, and the `organized_chaos` migration (which also adds a starter set
of 68 approved organs across all 11 systems).

On Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for **Production** (and Preview).
