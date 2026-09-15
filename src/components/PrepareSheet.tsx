import { useMemo, useState } from 'react'
import { TIER_INFO } from '../game/rules'
import { eligibleSpells, unfinishedYesterday } from '../game/state'
import type { Spell, Tier } from '../game/types'
import { Sheet } from '../ui/Sheet'
import { useGame } from '../store'

/** Picks what goes into an empty slot: something from the spellbook, or something new. */
export function PrepareSheet({ tier, onClose }: { tier: Tier; onClose: () => void }) {
  const { state, dispatch } = useGame()
  const [name, setName] = useState('')

  const carried = useMemo(() => unfinishedYesterday(state), [state])
  const options = useMemo(() => {
    const spells = eligibleSpells(state, tier)
    return [...spells].sort((a, b) => {
      const carriedDelta = Number(carried.has(b.id)) - Number(carried.has(a.id))
      if (carriedDelta) return carriedDelta
      if (b.tier !== a.tier) return b.tier - a.tier
      return (b.lastCastOn ?? '').localeCompare(a.lastCastOn ?? '')
    })
  }, [state, tier, carried])

  const prepare = (spell: Spell) => {
    dispatch({ type: 'prepare', spellId: spell.id, slotTier: tier })
    onClose()
  }

  const createAndPrepare = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    dispatch({ type: 'addSpell', name, tier, prepareInto: tier })
    onClose()
  }

  return (
    <Sheet
      title={`Prepare a ${TIER_INFO[tier].short}-tier slot`}
      subtitle={TIER_INFO[tier].hint}
      onClose={onClose}
    >
      <form onSubmit={createAndPrepare} data-tier={tier}>
        <div className="inline-add" style={{ marginTop: 0 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name something new…"
            aria-label="Name a new spell"
            enterKeyHint="done"
          />
          <button className="btn primary small" type="submit" disabled={!name.trim()}>
            Prepare
          </button>
        </div>
      </form>

      {options.length === 0 ? (
        <p className="empty-note" style={{ marginTop: 16 }}>
          Nothing in the spellbook fits this slot yet. Name something above.
        </p>
      ) : (
        <div className="section" style={{ marginTop: 20 }}>
          <div className="section-head">
            <h3 className="section-title">From your spellbook</h3>
          </div>
          {options.map((spell) => (
            <button className="book-entry" key={spell.id} data-tier={spell.tier} onClick={() => prepare(spell)}>
              <span className="book-rune">{TIER_INFO[spell.tier].rune}</span>
              <span className="book-body">
                <span className="book-name">{spell.name}</span>
                <span className="book-meta">
                  {carried.has(spell.id) ? (
                    <span className="tag upcast">unfinished yesterday</span>
                  ) : null}
                  {spell.tier < tier ? <span className="tag upcast">upcast</span> : null}
                  {spell.ritual ? <span className="tag ritual">ritual</span> : null}
                  {spell.timesCast > 0 ? (
                    <span className="tag">cast {spell.timesCast}×</span>
                  ) : null}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  )
}
