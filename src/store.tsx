import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { msUntilNextDay } from './game/date'
import { levelProgress } from './game/rules'
import { currentLevel, currentStreak, reducer, totalXp, type Action } from './game/state'
import { load, save } from './game/storage'
import type { GameState } from './game/types'

interface GameContextValue {
  state: GameState
  dispatch: (action: Action) => void
  level: number
  xp: number
  streak: number
  progress: ReturnType<typeof levelProgress>
  /** Set when a cast pushes you over a level boundary; clear it to dismiss. */
  levelUp: { from: number; to: number } | null
  clearLevelUp: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => load())
  const [levelUp, setLevelUp] = useState<{ from: number; to: number } | null>(null)

  const xp = totalXp(state)
  const level = currentLevel(state)
  const previousLevel = useRef(level)

  useEffect(() => {
    if (level > previousLevel.current) setLevelUp({ from: previousLevel.current, to: level })
    previousLevel.current = level
  }, [level])

  // Persist on every change. The state is small enough that debouncing would
  // cost more than it saves, and a lost write is a lost day.
  useEffect(() => {
    save(state)
  }, [state])

  // Roll over to a new day on its own, and again whenever the app comes back
  // into view -- a phone that slept through midnight never fired the timer.
  const dayStartHour = state.settings.dayStartHour
  const currentDate = state.today.date
  useEffect(() => {
    const tick = () => dispatch({ type: 'tick', now: Date.now() })
    tick()
    const timer = window.setTimeout(tick, msUntilNextDay(Date.now(), dayStartHour) + 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [dayStartHour, currentDate])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', state.settings.reduceMotion)
  }, [state.settings.reduceMotion])

  const clearLevelUp = useCallback(() => setLevelUp(null), [])

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      level,
      xp,
      streak: currentStreak(state),
      progress: levelProgress(xp),
      levelUp,
      clearLevelUp,
    }),
    [state, level, xp, levelUp, clearLevelUp],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside a GameProvider')
  return context
}
