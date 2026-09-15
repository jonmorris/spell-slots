import { CheckIcon } from '../ui/icons'

type OrbState = 'empty' | 'ready' | 'spent'

/**
 * A single slot rendered as an arcane orb: hollow when unprepared, charged once
 * a spell sits in it, and blazing once that spell is cast.
 */
export function Orb({ state }: { state: OrbState }) {
  return (
    <span className={`orb is-${state}`}>
      {state === 'spent' ? <CheckIcon className="orb-check" /> : null}
      {state === 'empty' ? <span className="orb-plus">+</span> : null}
    </span>
  )
}
