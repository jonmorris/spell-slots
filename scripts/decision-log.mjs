// Validates the pending decision-log entries, and folds them into the table.
//
//   npm run decision-log           list the pending entries
//   npm run decision-log -- --fold append them to docs/DECISION-LOG.md, delete files
//
// Fold on main, in a commit of its own. See docs/DECISION-LOG.md.
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appendRows, parseEntry, sortEntries } from './decision-log/entries.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const ENTRIES_DIR = join(ROOT, 'docs', 'decision-log')
export const LOG_FILE = join(ROOT, 'docs', 'DECISION-LOG.md')

/** Every entry filename in the folder, README aside. */
export function entryFilenames(dir = ENTRIES_DIR) {
  return readdirSync(dir).filter((name) => name !== 'README.md' && !name.startsWith('.'))
}

/** Reads and validates every pending entry, in fold order. Throws on the first bad one. */
export function loadEntries(dir = ENTRIES_DIR) {
  const entries = entryFilenames(dir).map((filename) =>
    parseEntry(filename, readFileSync(join(dir, filename), 'utf8')),
  )
  return sortEntries(entries)
}

function main() {
  const fold = process.argv.includes('--fold')
  let entries
  try {
    entries = loadEntries()
  } catch (error) {
    console.error(`decision-log: ${error.message}`)
    process.exit(1)
  }

  for (const entry of entries) console.log(entry.row)

  if (entries.length === 0) {
    console.log(fold ? 'Nothing to fold.' : 'No pending entries.')
    return
  }

  if (!fold) {
    console.log(`\n${entries.length} pending ${entries.length === 1 ? 'entry' : 'entries'}.`)
    return
  }

  const folded = appendRows(readFileSync(LOG_FILE, 'utf8'), entries.map((e) => e.row))
  writeFileSync(LOG_FILE, folded)
  for (const entry of entries) rmSync(join(ENTRIES_DIR, entry.filename))
  console.log(`\nFolded ${entries.length} into docs/DECISION-LOG.md and removed the files.`)
}

// Only run when invoked directly, so the tests can import the helpers above.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
