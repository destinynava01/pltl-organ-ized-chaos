# Organ-ized Chaos

A PLTL review game for body systems. Every team gets a patient whose organs got mixed up; the organs are dealt to
students' phones as cards. The patient is rebuilt like a puzzle, one body system at a time: the game draws 3 to 6
systems at random, in a random order (the same for every team), and each is revealed when the one before it is
complete. Students play only the cards that belong to the current system. A wrong card is a rejection: it stays in
hand and the patient's vitals drop. The first team to rebuild its patient (with the best vitals) wins.

- **Level 1:** cards show the organ's name. **Level 2:** cards show only what it does. **Level 3:** functions, plus
  organs that belong to two systems (needed in both).
- After two misses on the same card, it shows a hint (its other side).
- Points: 10 per organ, 25 per system completed, a finish bonus for the first three patients rebuilt, plus the
  vitals left.
- The projector shows each patient's monitor, the system it's on (and how full it is), the systems done, and "?" for
  the ones still to come. It never shows which organs went where, so teams can't copy each other. The results show
  the answer key, with the organs the class missed most first.

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
Functions, the rules in `_shared/organized.ts`, and the `organized_chaos` migrations (the first also adds a starter
set of 68 approved organs across all 11 systems).

On Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for **Production** (and Preview).
