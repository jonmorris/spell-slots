import { titleForLevel } from '../game/rules'
import { useGame } from '../store'

export function TopBar() {
  const { level, xp, streak, progress } = useGame()
  const streakAlive = streak > 0

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="level-badge">
          <b>{level}</b>
          <span>lvl</span>
        </div>
        <div className="topbar-main">
          <div className="topbar-title">
            <span className="title-name">{titleForLevel(level)}</span>
            <span
              className={streakAlive ? 'streak' : 'streak cold'}
              title={
                streakAlive
                  ? `${streak} day${streak === 1 ? '' : 's'} of spending every slot`
                  : 'Spend every slot today to start a streak'
              }
            >
              {streakAlive ? '🔥' : '·'} {streak}
            </span>
          </div>
          <div
            className="xp-meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress.fraction * 100)}
            aria-label="Progress to the next level"
          >
            <div className="xp-fill" style={{ width: `${progress.fraction * 100}%` }} />
          </div>
          <div className="xp-text">
            {progress.atMax
              ? `${xp.toLocaleString()} XP — the weave holds no more`
              : `${progress.into.toLocaleString()} / ${progress.needed.toLocaleString()} XP to level ${level + 1}`}
          </div>
        </div>
      </div>
    </header>
  )
}
