import { useRef, useState } from 'react'
import { formatDay, weekdayLetter } from '../game/date'
import {
  MAX_LEVEL,
  TIER_INFO,
  TIERS,
  slotsForLevel,
  titleForLevel,
  totalSlots,
} from '../game/rules'
import { initialState, slotsSpent, slotsTotal } from '../game/state'
import { exportFile, importFile } from '../game/storage'
import { useGame } from '../store'

export function CharacterView() {
  const { state, dispatch, level, xp, streak, progress } = useGame()
  const fileInput = useRef<HTMLInputElement>(null)
  const [resetting, setResetting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const slots = state.today.slots
  const next = level < MAX_LEVEL ? slotsForLevel(level + 1) : null
  const casts = state.spells.reduce((sum, s) => sum + s.timesCast, 0)
  const recent = [...state.history.slice(-29), state.today]
  // Today is only filed at the long rest, so count it here to match the streak.
  const days = state.daysAdventured + (state.today.prepared.length > 0 ? 1 : 0)

  const onImport = async (file: File) => {
    try {
      const imported = await importFile(file)
      dispatch({ type: 'replaceState', state: imported })
      setImportError(null)
    } catch {
      setImportError('That file could not be read as a Spell Slots backup.')
    }
  }

  return (
    <div className="view">
      <div className="hero">
        <div className="hero-level">{level}</div>
        <div className="hero-title">{titleForLevel(level)}</div>
        <div className="hero-xp">
          {xp.toLocaleString()} XP
          {progress.atMax ? ' — maximum level' : ` · ${progress.needed - progress.into} to level ${level + 1}`}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <b>{streak}</b>
          <span>Streak</span>
        </div>
        <div className="stat">
          <b>{state.bestStreak}</b>
          <span>Best</span>
        </div>
        <div className="stat">
          <b>{days}</b>
          <span>Days</span>
        </div>
        <div className="stat">
          <b>{casts}</b>
          <span>Cast</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Slots per day</h2>
          <span className="section-note">{totalSlots(slots)} in total</span>
        </div>
        <div className="slot-table">
          {TIERS.map((tier) => {
            const have = slots[tier]
            const coming = next ? next[tier] - have : 0
            if (have === 0 && coming === 0) return null
            return (
              <div className="slot-table-row" data-tier={tier} key={tier}>
                <span className="slot-table-label">{TIER_INFO[tier].short}</span>
                <span className="pip-row">
                  {Array.from({ length: have }, (_, i) => (
                    <span className="pip" key={`have-${i}`} />
                  ))}
                  {Array.from({ length: coming }, (_, i) => (
                    <span className="pip future" key={`coming-${i}`} />
                  ))}
                </span>
                {coming > 0 ? <span className="slot-table-next">+{coming} next level</span> : null}
              </div>
            )
          })}
        </div>
        <p className="section-note" style={{ marginTop: 10, display: 'block' }}>
          Cantrips stay free and unlimited at every level — they are never the
          thing that makes a day too full.
        </p>
      </section>

      {recent.length > 1 ? (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Recent days</h2>
            <span className="section-note">Gold means every slot spent</span>
          </div>
          <div className="history-strip">
            {recent.map((day) => {
              const total = slotsTotal(day)
              const fraction = total === 0 ? 0 : slotsSpent(day) / total
              return (
                <div
                  className={day.complete ? 'history-day complete' : 'history-day'}
                  key={day.date}
                  title={`${formatDay(day.date, state.today.date)} — ${slotsSpent(day)}/${total} slots`}
                >
                  <div className="history-bar">
                    <div className="history-fill" style={{ height: `${fraction * 100}%` }} />
                  </div>
                  <div className="history-label">{weekdayLetter(day.date)}</div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Settings</h2>
        </div>
        <div className="field" style={{ marginTop: 0 }}>
          <label htmlFor="day-start">A new day begins at</label>
          <select
            id="day-start"
            value={state.settings.dayStartHour}
            onChange={(e) =>
              dispatch({
                type: 'updateSettings',
                patch: { dayStartHour: Number(e.target.value) },
              })
            }
          >
            {[0, 1, 2, 3, 4, 5, 6].map((hour) => (
              <option value={hour} key={hour}>
                {hour === 0 ? 'Midnight' : `${hour}:00 am`}
              </option>
            ))}
          </select>
          <p className="section-note" style={{ marginTop: 6, display: 'block' }}>
            Set this past midnight and a late night still spends the day before's slots.
          </p>
        </div>

        <div className="switch-row" style={{ marginTop: 14 }}>
          <span className="switch-text">
            <b>Reduce motion</b>
            <span>Turn off the flourishes.</span>
          </span>
          <button
            className="switch"
            role="switch"
            aria-checked={state.settings.reduceMotion}
            aria-label="Reduce motion"
            onClick={() =>
              dispatch({
                type: 'updateSettings',
                patch: { reduceMotion: !state.settings.reduceMotion },
              })
            }
          />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Your data</h2>
        </div>
        <p className="section-note" style={{ display: 'block', marginBottom: 10 }}>
          Everything lives on this device only. Nothing is uploaded anywhere, so a
          backup is the only way to move it.
        </p>
        <div className="danger-zone">
          <button className="btn small" onClick={() => exportFile(state)}>
            Export backup
          </button>
          <button className="btn small" onClick={() => fileInput.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onImport(file)
              e.target.value = ''
            }}
          />
          {resetting ? (
            <>
              <button
                className="btn danger small"
                onClick={() => {
                  dispatch({ type: 'replaceState', state: initialState() })
                  setResetting(false)
                }}
              >
                Erase everything
              </button>
              <button className="btn ghost small" onClick={() => setResetting(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn ghost small" onClick={() => setResetting(true)}>
              Start over
            </button>
          )}
        </div>
        {importError ? (
          <p className="section-note" style={{ display: 'block', marginTop: 8, color: 'var(--danger)' }}>
            {importError}
          </p>
        ) : null}
      </section>
    </div>
  )
}
