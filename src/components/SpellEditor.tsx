import { useState } from 'react'
import { TIER_INFO } from '../game/rules'
import type { Tier } from '../game/types'
import { Sheet } from '../ui/Sheet'
import { useGame } from '../store'

const ALL_TIERS: Tier[] = [0, 1, 2, 3, 4]

interface Props {
  /** The spell being edited, or null to create a new one. */
  spellId: string | null
  onClose: () => void
}

export function SpellEditor({ spellId, onClose }: Props) {
  const { state, dispatch } = useGame()
  // Looked up live rather than passed in, so toggling archive re-renders here.
  const spell = spellId ? (state.spells.find((s) => s.id === spellId) ?? null) : null
  const [name, setName] = useState(spell?.name ?? '')
  const [notes, setNotes] = useState(spell?.notes ?? '')
  const [tier, setTier] = useState<Tier>(spell?.tier ?? 1)
  const [ritual, setRitual] = useState(spell?.ritual ?? false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const save = () => {
    if (!name.trim()) return
    if (spell) {
      dispatch({
        type: 'updateSpell',
        id: spell.id,
        patch: { name: name.trim(), notes, tier, ritual },
      })
    } else {
      dispatch({ type: 'addSpell', name, tier, ritual, notes })
    }
    onClose()
  }

  return (
    <Sheet
      title={spell ? 'Edit spell' : 'New spell'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" style={{ flex: 1 }} onClick={save} disabled={!name.trim()}>
            {spell ? 'Save' : 'Add to spellbook'}
          </button>
        </div>
      }
    >
      <div className="field" style={{ marginTop: 0 }}>
        <label htmlFor="spell-name">Name</label>
        <input
          id="spell-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Write the thesis introduction"
        />
      </div>

      <div className="field" data-tier={tier}>
        <label>Cost</label>
        <div className="tier-choice">
          {ALL_TIERS.map((option) => (
            <button
              className="tier-option"
              key={option}
              data-tier={option}
              aria-pressed={tier === option}
              onClick={() => setTier(option)}
            >
              <b>{TIER_INFO[option].short}</b>
              <span>{TIER_INFO[option].tiny}</span>
            </button>
          ))}
        </div>
        <p className="tier-hint">{TIER_INFO[tier].hint}</p>
      </div>

      <div className="field">
        <label htmlFor="spell-notes">Notes</label>
        <textarea
          id="spell-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What does done look like?"
        />
      </div>

      <div className="switch-row">
        <span className="switch-text">
          <b>Ritual</b>
          <span>Prepare this automatically every morning.</span>
        </span>
        <button
          className="switch"
          role="switch"
          aria-checked={ritual}
          aria-label="Ritual"
          onClick={() => setRitual((v) => !v)}
        />
      </div>

      {spell ? (
        <div className="switch-row">
          <span className="switch-text">
            <b>{spell.archived ? 'Archived' : 'Active'}</b>
            <span>
              {spell.archived
                ? 'Hidden from preparation, but its history is kept.'
                : `Cast ${spell.timesCast} time${spell.timesCast === 1 ? '' : 's'} so far.`}
            </span>
          </span>
          <button
            className="switch"
            role="switch"
            aria-checked={!spell.archived}
            aria-label="Active"
            onClick={() =>
              dispatch({
                type: 'updateSpell',
                id: spell.id,
                patch: { archived: !spell.archived },
              })
            }
          />
        </div>
      ) : null}

      {spell ? (
        <div className="danger-zone">
          {confirmingDelete ? (
            <>
              <button
                className="btn danger small"
                onClick={() => {
                  dispatch({ type: 'deleteSpell', id: spell.id })
                  onClose()
                }}
              >
                Delete forever
              </button>
              <button className="btn ghost small" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </button>
            </>
          ) : (
            <button className="btn ghost small" onClick={() => setConfirmingDelete(true)}>
              Delete spell
            </button>
          )}
        </div>
      ) : null}
    </Sheet>
  )
}
