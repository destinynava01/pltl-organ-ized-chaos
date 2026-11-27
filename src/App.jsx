import { useEffect, useState } from 'react'
import { ocGame } from './api'
import Board from './Board'
import Lobby from './Lobby'
import Review from './Review'
import StudentJoin from './StudentJoin'
import Submit from './Submit'
import { HUB_URL, SITE_NAME, SITE_TAGLINE } from './config'
import { readSession, saveSession } from './session'
import { isConfigured } from './supabase'
import { Button, CenterCard } from './ui'
import { SLIDES as LANDING_SLIDES } from './howToSlides'

// Routes:
//   /        leader: landing -> lobby -> board (the projector)
//   /join    student phone: join, get a team, hold organ cards, place them in the right body systems
//   /submit  anyone: submit an organ (name, function, its body system or two)
//   /review  reviewers (same sign-in and reviewer list as the other sites): approve, edit, reject organs
function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (!isConfigured) return <NotConfigured />
  if (path === '/join') return <StudentJoin />
  if (path === '/submit') return <Submit />
  if (path === '/review') return <Review />
  return <LeaderApp />
}

function LeaderApp() {
  const [saved] = useState(readSession) // a game this tab was running before the page loaded
  const [screen, setScreen] = useState(saved ? 'restoring' : 'landing') // restoring | landing | lobby | board
  const [session, setSession] = useState(null) // { gameId, hostToken, joinCode } once the game has started
  const [resume, setResume] = useState(null) // { session, teams, finalized } to rebuild the lobby
  const [lobbyNumber, setLobbyNumber] = useState(0)

  // After a refresh: ask the server for the game and put the leader back where they were
  useEffect(() => {
    if (!saved) return
    ocGame({ action: 'get_state', game_id: saved.gameId, host_token: saved.hostToken })
      .then((data) => {
        const names = (data.teams ?? []).map((t) => t.name)
        const restored = { ...saved, joinCode: data.game.join_code }
        setResume({ session: restored, teams: names, finalized: names.length > 0 })
        if (data.game.status !== 'setup') {
          setSession(restored)
          setScreen('board')
        } else {
          setScreen('lobby')
        }
      })
      .catch(() => {
        saveSession(null)
        setScreen('landing')
      })
  }, [saved])

  // Close the game: students' phones go back to the join page, and the leader starts fresh
  async function closeGame() {
    const current = session ?? resume?.session ?? readSession()
    if (current) {
      try {
        await ocGame({ action: 'close_game', game_id: current.gameId, host_token: current.hostToken })
      } catch {
        // Already gone
      }
    }
    saveSession(null)
    setSession(null)
    setResume(null)
    setLobbyNumber((n) => n + 1)
    setScreen('lobby')
  }

  if (screen === 'restoring') {
    return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">Restoring your game…</p></CenterCard>
  }

  if (screen === 'landing') {
    return (
      <CenterCard title={SITE_NAME}>
        <p className="mt-2 font-display text-lg text-info">{SITE_TAGLINE}</p>
        <div className="mt-6 flex justify-center text-left [&>*]:max-w-full">{LANDING_SLIDES[0].art}</div>
        <p className="mt-3 text-muted">
          Every team gets a patient whose organs are all mixed up, dealt to their phones as cards. Rebuild it one body
          system at a time, like a puzzle: play the cards that belong to the current system. Wrong card? Rejected, and
          the patient&apos;s vitals drop.
        </p>
        <Button className="mt-6" onClick={() => setScreen('lobby')}>🚑 Open the lobby</Button>
        <a href={HUB_URL} className="mt-4 block text-sm font-bold text-info hover:brightness-125">← All games</a>
      </CenterCard>
    )
  }

  // The lobby stays mounted (just hidden) so going back and forth keeps its state
  return (
    <>
      <div hidden={screen !== 'lobby'}>
        <Lobby
          key={lobbyNumber}
          resume={resume}
          hasGame={!!session}
          onOpenBoard={() => setScreen('board')}
          onCloseGame={closeGame}
          onStart={(started) => { setSession(started); setScreen('board') }}
        />
      </div>
      {session && screen === 'board' && (
        <Board session={session} onLobby={() => setScreen('lobby')} onNewGame={closeGame} />
      )}
    </>
  )
}

function NotConfigured() {
  return (
    <CenterCard title="Setup needed">
      <p className="mt-4 text-muted">
        Add your Supabase address and public key to <code>.env.local</code> (see <code>.env.example</code>), then restart.
      </p>
    </CenterCard>
  )
}

export default App
