import { useEffect, useState } from 'react'
import { ocGame } from './api'
import { systemInfo } from './config'
import { Button, Label, Panel } from './ui'

// After the game: teams ranked by points, the answer key (the organs the class missed most first), and the
// results download.
export default function Results({ session, onNewGame, onLobby }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => { ocGame({ action: 'report', game_id: session.gameId, host_token: session.hostToken }).then(setReport).catch((e) => setError(e.message)) }, [session])

  async function download() {
    setDownloading(true)
    try {
      const { downloadResults } = await import('./gameResults')
      await downloadResults(report)
    } catch (e) {
      setError(e.message || 'Could not download the results.')
    } finally {
      setDownloading(false)
    }
  }

  if (!report) return <main className="er-bg flex min-h-dvh items-center justify-center"><p className="text-muted">{error || 'Writing up the charts…'}</p></main>
  const ranked = [...report.teams].sort((a, b) => b.points - a.points)
  const medal = ['🥇', '🥈', '🥉']
  const missed = report.key.filter((k) => k.misses > 0)

  return (
    <main className="er-bg min-h-dvh p-4 text-ink sm:p-8">
      <Panel className="mx-auto max-w-4xl text-center">
        <p className="text-5xl">🏥</p>
        <h1 className="mt-2 font-display text-5xl font-bold text-accent">Discharge Report</h1>
        <p className="mt-1 text-muted">Level {report.level} · {report.systems.join(' · ')}</p>

        <ol className="mx-auto mt-6 max-w-xl space-y-3 text-left">
          {ranked.map((t, i) => (
            <li key={t.index} className="rounded-2xl border border-line bg-panel p-4" style={{ borderLeft: `8px solid ${t.color}` }}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-bold">{medal[i] ?? `#${i + 1}`} {t.name}</p>
                <p className="font-display text-3xl font-bold text-accent">{t.points}</p>
              </div>
              <p className="mt-1 text-sm text-muted">
                {t.finish_rank ? `Rebuilt ${['1st', '2nd', '3rd'][t.finish_rank - 1] ?? `#${t.finish_rank}`}` : `${t.placed}/${t.total} organs back`} · vitals {t.vitals}% · {t.rejections} rejection{t.rejections === 1 ? '' : 's'}{t.bonuses ? ` · ⭐ ${t.bonuses} bonus${t.bonuses === 1 ? '' : 'es'}` : ''}
              </p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-8 max-w-3xl text-left">
          <Label>The answer key{missed.length ? ' (the most-rejected organs first: good ones to go over)' : ''}</Label>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {report.key.map((k) => (
              <li key={k.name} className={`rounded-2xl border p-3 text-sm ${k.misses ? 'border-bad bg-bad-soft' : 'border-line bg-card'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-semibold">{k.name}</p>
                  {k.misses > 0 && <span className="shrink-0 rounded-full bg-bad px-2 py-0.5 text-xs font-bold text-white">{k.misses} rejection{k.misses === 1 ? '' : 's'}</span>}
                </div>
                <p className="mt-1 flex flex-wrap gap-1">
                  {k.systems.map((s) => <span key={s} className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: systemInfo(s).color }}>{systemInfo(s).emoji} {s}</span>)}
                </p>
                <p className="mt-1 text-muted">{k.function}</p>
                {k.wrong_systems.length > 0 && <p className="mt-1 text-xs font-semibold text-bad">Tried: {k.wrong_systems.join(', ')}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-8 grid max-w-md gap-2 sm:grid-cols-2">
          <Button variant="chaos" disabled={downloading} onClick={download}>{downloading ? 'Preparing…' : '⬇️ Results (.xlsx)'}</Button>
          <Button onClick={onNewGame}>New game</Button>
        </div>
        <p className="mt-2 text-sm text-muted">Download before starting a new game. New game closes this one, and game data is cleared after 8 hours.</p>
        <button type="button" onClick={onLobby} className="mt-2 text-sm font-bold text-info">Back to the lobby</button>
        {error && <p className="mt-2 font-bold text-bad">{error}</p>}
      </Panel>
    </main>
  )
}
