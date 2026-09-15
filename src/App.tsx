import { useState } from 'react'
import { CharacterView } from './components/CharacterView'
import { LevelUpModal } from './components/LevelUpModal'
import { SpellbookView } from './components/SpellbookView'
import { TodayView } from './components/TodayView'
import { TopBar } from './components/TopBar'
import { BookIcon, OrbIcon, StarIcon } from './ui/icons'

type Tab = 'today' | 'spellbook' | 'character'

const TABS: { id: Tab; label: string; Icon: typeof OrbIcon }[] = [
  { id: 'today', label: 'Today', Icon: OrbIcon },
  { id: 'spellbook', label: 'Spellbook', Icon: BookIcon },
  { id: 'character', label: 'Character', Icon: StarIcon },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('today')

  return (
    <div className="app">
      <TopBar />

      <main id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'today' ? <TodayView /> : null}
        {tab === 'spellbook' ? <SpellbookView /> : null}
        {tab === 'character' ? <CharacterView /> : null}
      </main>

      <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map(({ id, label, Icon }) => (
          <button
            className="tab"
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      <LevelUpModal />
    </div>
  )
}
