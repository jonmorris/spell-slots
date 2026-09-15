import { useState } from 'react'
import { TIERS, TIER_INFO } from '../game/rules'
import {
  cantrips,
  openSlots,
  openSlotsTotal,
  preparedInTier,
  slotsSpent,
  slotsTotal,
} from '../game/state'
import type { Prepared, Tier } from '../game/types'
import { formatDay } from '../game/date'
import { useGame } from '../store'
import { Orb } from './Orb'
import { PrepareSheet } from './PrepareSheet'
import { CheckIcon } from '../ui/icons'

export function TodayView() {
  const { state, dispatch } = useGame()
  const day = state.today
  const [preparingTier, setPreparingTier] = useState<Tier | null>(null)

  const spent = slotsSpent(day)
  const total = slotsTotal(day)
  const empty = openSlotsTotal(day)
  const list = cantrips(day)

  return (
    <div className="view">
      <div className="day-head">
        <div className="day-date">{formatDay(day.date, day.date)}</div>
        <h1 className="day-line">
          {spent} of {total} slot{total === 1 ? '' : 's'} spent
        </h1>
        <p className="day-sub">{headline(day.complete, empty, total - spent - empty)}</p>
      </div>

      {day.complete ? (
        <div className="banner">
          <b>Every slot spent.</b>
          <p>
            Rest well. They refill at {formatHour(state.settings.dayStartHour)}, and nothing
            more is asked of you today.
          </p>
        </div>
      ) : null}

      {TIERS.filter((tier) => day.slots[tier] > 0).map((tier) => {
        const filled = preparedInTier(day, tier)
        const free = openSlots(day, tier)
        return (
          <section className="tier-group" data-tier={tier} key={tier}>
            <div className="tier-head">
              <span className="tier-pip" />
              <h2 className="tier-name">{TIER_INFO[tier].short}-tier</h2>
              <span className="tier-count">
                {filled.filter((p) => p.done).length}/{day.slots[tier]} spent
              </span>
            </div>

            {filled.map((prepared) => (
              <SlotRow
                key={prepared.id}
                prepared={prepared}
                onToggle={() => dispatch({ type: 'toggleDone', preparedId: prepared.id })}
                onDrop={() => dispatch({ type: 'unprepare', preparedId: prepared.id })}
              />
            ))}

            {Array.from({ length: free }, (_, i) => (
              <button
                className="slot empty"
                key={`empty-${i}`}
                onClick={() => setPreparingTier(tier)}
              >
                <Orb state="empty" />
                <span className="slot-body">
                  <span className="slot-name">Empty {TIER_INFO[tier].short}-tier slot</span>
                  <span className="slot-meta">{TIER_INFO[tier].blurb}</span>
                </span>
              </button>
            ))}
          </section>
        )
      })}

      <section className="section" data-tier="0">
        <div className="section-head">
          <h2 className="section-title">Cantrips</h2>
          <span className="section-note">
            {list.length > 6
              ? 'Free, but your attention is not'
              : 'Free — they cost no slot'}
          </span>
        </div>

        {list.map((prepared) => (
          <div className={prepared.done ? 'cantrip done' : 'cantrip'} key={prepared.id}>
            <button
              className="cantrip-main"
              onClick={() => dispatch({ type: 'toggleDone', preparedId: prepared.id })}
              aria-pressed={prepared.done}
            >
              <span className="cantrip-box">{prepared.done ? <CheckIcon /> : null}</span>
              <span className="cantrip-name">{prepared.name}</span>
            </button>
            <button
              className="slot-drop"
              aria-label={`Remove ${prepared.name}`}
              onClick={() => dispatch({ type: 'unprepare', preparedId: prepared.id })}
            >
              ×
            </button>
          </div>
        ))}

        <CantripAdd />
      </section>

      {state.daysAdventured < 3 ? (
        <p className="creed">
          <b>Two slots is the whole point.</b> You cannot prepare more than you
          have, and you earn more only by finishing the days you already have.
          Cantrips stay free forever — spend them freely, they are not what
          makes a day too full.
        </p>
      ) : null}

      {preparingTier !== null ? (
        <PrepareSheet tier={preparingTier} onClose={() => setPreparingTier(null)} />
      ) : null}
    </div>
  )
}

function SlotRow({
  prepared,
  onToggle,
  onDrop,
}: {
  prepared: Prepared
  onToggle: () => void
  onDrop: () => void
}) {
  const upcast = prepared.tier < prepared.slotTier
  return (
    <div
      className={prepared.done ? 'slot filled spent' : 'slot filled'}
      data-tier={prepared.slotTier}
    >
      <button className="slot-main" onClick={onToggle} aria-pressed={prepared.done}>
        <Orb state={prepared.done ? 'spent' : 'ready'} />
        <span className="slot-body">
          <span className="slot-name">{prepared.name}</span>
          <span className="slot-meta">
            {prepared.done ? 'Cast' : 'Prepared'}
            {upcast ? <span className="tag upcast">upcast</span> : null}
          </span>
        </span>
      </button>
      {prepared.done ? null : (
        <button className="slot-drop" onClick={onDrop} aria-label={`Unprepare ${prepared.name}`}>
          ×
        </button>
      )}
    </div>
  )
}

function CantripAdd() {
  const { dispatch } = useGame()
  const [text, setText] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({ type: 'addSpell', name: text, tier: 0, prepareInto: 0 })
    setText('')
  }

  return (
    <form className="inline-add" onSubmit={submit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a cantrip…"
        aria-label="Add a cantrip"
        enterKeyHint="done"
      />
      <button className="btn small" type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}

function headline(complete: boolean, empty: number, readyToCast: number): string {
  if (complete) return 'The day is complete. Anything more is a gift, not a duty.'
  if (empty > 0) {
    return `${empty} slot${empty === 1 ? '' : 's'} still empty. What deserves ${
      empty === 1 ? 'it' : 'them'
    }?`
  }
  if (readyToCast > 0) {
    return `Everything is prepared. ${readyToCast} left to cast.`
  }
  return 'Your slots are laid out. Begin when you are ready.'
}

function formatHour(hour: number): string {
  if (hour === 0) return 'midnight'
  const suffix = hour < 12 ? 'am' : 'pm'
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}${suffix}`
}
