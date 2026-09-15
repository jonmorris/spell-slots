import { useState } from 'react'
import { TIER_INFO } from '../game/rules'
import type { Tier } from '../game/types'
import { useGame } from '../store'
import { SpellEditor } from './SpellEditor'
import { PlusIcon } from '../ui/icons'

const GROUPS: { tier: Tier; label: string }[] = [
  { tier: 4, label: 'Fourth tier' },
  { tier: 3, label: 'Third tier' },
  { tier: 2, label: 'Second tier' },
  { tier: 1, label: 'First tier' },
  { tier: 0, label: 'Cantrips' },
]

export function SpellbookView() {
  const { state } = useGame()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const preparedIds = new Set(state.today.prepared.map((p) => p.spellId))
  const visible = state.spells.filter((s) => showArchived || !s.archived)
  const archivedCount = state.spells.filter((s) => s.archived).length

  return (
    <div className="view">
      <div className="day-head">
        <div className="day-date">Spellbook</div>
        <h1 className="day-line">Everything you might do</h1>
        <p className="day-sub">
          Nothing here costs you anything until you prepare it for a day.
        </p>
      </div>

      <button className="btn primary wide" style={{ marginTop: 16 }} onClick={() => setCreating(true)}>
        <PlusIcon /> New spell
      </button>

      {visible.length === 0 ? (
        <p className="empty-note" style={{ marginTop: 20 }}>
          Your spellbook is empty. Add the things you keep meaning to do.
        </p>
      ) : null}

      {GROUPS.map(({ tier, label }) => {
        const spells = visible.filter((s) => s.tier === tier)
        if (spells.length === 0) return null
        return (
          <section className="section" key={tier}>
            <div className="section-head">
              <h2 className="section-title">{label}</h2>
              <span className="section-note">{TIER_INFO[tier].blurb}</span>
            </div>
            {spells.map((spell) => (
              <button
                className={spell.archived ? 'book-entry archived' : 'book-entry'}
                key={spell.id}
                data-tier={spell.tier}
                onClick={() => setEditingId(spell.id)}
              >
                <span className="book-rune">{TIER_INFO[spell.tier].rune}</span>
                <span className="book-body">
                  <span className="book-name">{spell.name}</span>
                  <span className="book-meta">
                    {spell.ritual ? <span className="tag ritual">ritual</span> : null}
                    {preparedIds.has(spell.id) ? <span className="tag">prepared today</span> : null}
                    {spell.timesCast > 0 ? (
                      <span className="tag">cast {spell.timesCast}×</span>
                    ) : null}
                  </span>
                </span>
              </button>
            ))}
          </section>
        )
      })}

      {archivedCount > 0 ? (
        <button
          className="btn ghost wide"
          style={{ marginTop: 20 }}
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'Hide' : 'Show'} {archivedCount} archived
        </button>
      ) : null}

      {creating ? <SpellEditor spellId={null} onClose={() => setCreating(false)} /> : null}
      {editingId ? <SpellEditor spellId={editingId} onClose={() => setEditingId(null)} /> : null}
    </div>
  )
}
