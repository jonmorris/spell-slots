import { TIER_INFO, levelUpGains, titleForLevel } from '../game/rules'
import { Orb } from './Orb'
import { useGame } from '../store'

/** The payoff: a new level means real new capacity tomorrow, not just a number. */
export function LevelUpModal() {
  const { levelUp, clearLevelUp } = useGame()
  if (!levelUp) return null

  const gains = levelUpGains(levelUp.from, levelUp.to)
  const newTitle = titleForLevel(levelUp.to) !== titleForLevel(levelUp.from)

  return (
    <div className="scrim" style={{ alignItems: 'center' }} onPointerDown={clearLevelUp}>
      <div
        className="levelup"
        role="dialog"
        aria-modal="true"
        aria-label={`Level ${levelUp.to}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="levelup-kicker">Level up</div>
        <div className="levelup-level">{levelUp.to}</div>
        <div className="levelup-title">
          {newTitle ? `You are now ${titleForLevel(levelUp.to)}` : titleForLevel(levelUp.to)}
        </div>

        <div className="levelup-gains">
          {gains.map(({ tier, gained }) => (
            <div className="gain" data-tier={tier} key={tier}>
              <Orb state="ready" />
              <span>
                <b>
                  +{gained} {TIER_INFO[tier].short}-tier slot{gained === 1 ? '' : 's'}
                </b>{' '}
                — {TIER_INFO[tier].blurb.toLowerCase()}
              </span>
            </div>
          ))}
        </div>

        <p className="section-note" style={{ display: 'block', marginBottom: 14 }}>
          You earned room for more. It arrives with tomorrow's rest.
        </p>
        <button className="btn primary wide" onClick={clearLevelUp}>
          Onward
        </button>
      </div>
    </div>
  )
}
