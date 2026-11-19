import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  KINDS,
  appendRows,
  dateFromFilename,
  isValidFilename,
  parseEntry,
  sortEntries,
} from './entries.mjs'
import { ENTRIES_DIR, LOG_FILE, entryFilenames, loadEntries } from '../decision-log.mjs'

const GOOD = '| 2026-11-19 | Process | Adopted a decision log | docs/DECISIONS.md → Not doing (yet) |'

describe('filenames', () => {
  it('accepts a dated, lowercase, hyphenated name', () => {
    expect(isValidFilename('2026-11-19-adopt-decision-log.md')).toBe(true)
    expect(isValidFilename('2026-01-02-cap.md')).toBe(true)
    expect(isValidFilename('2026-01-02-slot-table-v2.md')).toBe(true)
  })

  it('rejects anything that would sort or parse badly', () => {
    expect(isValidFilename('adopt-decision-log.md')).toBe(false) // no date
    expect(isValidFilename('2026-11-19-Adopt.md')).toBe(false) // uppercase
    expect(isValidFilename('2026-11-19-adopt_log.md')).toBe(false) // underscore
    expect(isValidFilename('2026-11-19-adopt--log.md')).toBe(false) // doubled hyphen
    expect(isValidFilename('2026-11-19-adopt-.md')).toBe(false) // trailing hyphen
    expect(isValidFilename('2026-11-19.md')).toBe(false) // no name
    expect(isValidFilename('2026-11-19-adopt.txt')).toBe(false) // not markdown
    expect(isValidFilename('README.md')).toBe(false)
  })

  it('reads the date back off the filename', () => {
    expect(dateFromFilename('2026-11-19-adopt-decision-log.md')).toBe('2026-11-19')
  })
})

describe('parsing an entry', () => {
  const parse = (contents, filename = '2026-11-19-adopt-decision-log.md') =>
    parseEntry(filename, contents)

  it('reads the four cells', () => {
    const entry = parse(GOOD)
    expect(entry.date).toBe('2026-11-19')
    expect(entry.kind).toBe('Process')
    expect(entry.decision).toBe('Adopted a decision log')
    expect(entry.ref).toBe('docs/DECISIONS.md → Not doing (yet)')
  })

  it('normalises the row it emits, whatever the spacing', () => {
    expect(parse('|2026-11-19|Process|Adopted a decision log|docs/DECISIONS.md → x|').row).toBe(
      '| 2026-11-19 | Process | Adopted a decision log | docs/DECISIONS.md → x |',
    )
  })

  it('ignores blank lines around the row', () => {
    expect(parse(`\n\n${GOOD}\n\n`).date).toBe('2026-11-19')
  })

  it('rejects a file holding more than one row', () => {
    expect(() => parse(`${GOOD}\n${GOOD}`)).toThrow(/exactly one table row, found 2/)
  })

  it('rejects an empty file', () => {
    expect(() => parse('   \n\n')).toThrow(/file is empty/)
  })

  it('rejects a row missing its outer pipes', () => {
    expect(() => parse('2026-11-19 | Process | Adopted | ref')).toThrow(/start and end with/)
  })

  it('rejects the wrong number of cells', () => {
    expect(() => parse('| 2026-11-19 | Process | Adopted |')).toThrow(/exactly 4 cells, found 3|exactly 4 cells \(Date, Kind, Decision, Ref\), found 3/)
    expect(() => parse(`| 2026-11-19 | Process | A | b | c |`)).toThrow(/found 5/)
  })

  it('rejects a Date cell that disagrees with the filename', () => {
    expect(() => parse('| 2026-11-20 | Process | Adopted | ref |')).toThrow(
      /Date cell is "2026-11-20" but the filename says "2026-11-19"/,
    )
  })

  it('rejects a Kind outside the list', () => {
    expect(() => parse('| 2026-11-19 | Vibes | Adopted | ref |')).toThrow(/Kind "Vibes" is not one of/)
  })

  it('rejects empty Decision or Ref cells', () => {
    expect(() => parse('| 2026-11-19 | Process |  | ref |')).toThrow(/Decision cell is empty/)
    expect(() => parse('| 2026-11-19 | Process | Adopted |  |')).toThrow(/Ref cell is empty/)
  })

  it('rejects a bad filename before anything else', () => {
    expect(() => parse(GOOD, 'notes.md')).toThrow(/filename must look like/)
  })

  it('names the file in every message', () => {
    expect(() => parse('')).toThrow(/^2026-11-19-adopt-decision-log\.md: /)
  })
})

describe('ordering', () => {
  it('sorts by filename, which is date then name', () => {
    const entries = [
      { filename: '2026-11-19-b.md' },
      { filename: '2026-01-02-z.md' },
      { filename: '2026-11-19-a.md' },
    ]
    expect(sortEntries(entries).map((e) => e.filename)).toEqual([
      '2026-01-02-z.md',
      '2026-11-19-a.md',
      '2026-11-19-b.md',
    ])
  })

  it('does not mutate its input', () => {
    const entries = [{ filename: 'b.md' }, { filename: 'a.md' }]
    sortEntries(entries)
    expect(entries[0].filename).toBe('b.md')
  })
})

describe('folding into the table', () => {
  const doc = ['# Log', '', '| Date | Kind | Decision | Ref |', '| --- | --- | --- | --- |', '| 2026-01-01 | Product | First | ref |', ''].join('\n')

  it('appends after the last table row', () => {
    const out = appendRows(doc, ['| 2026-02-02 | Design | Second | ref |'])
    expect(out.split('\n').filter((l) => l.startsWith('|')).at(-1)).toBe(
      '| 2026-02-02 | Design | Second | ref |',
    )
  })

  it('keeps the rows already there, in order', () => {
    const out = appendRows(doc, ['| 2026-02-02 | Design | Second | ref |'])
    const rows = out.split('\n').filter((l) => l.startsWith('| 20'))
    expect(rows).toEqual([
      '| 2026-01-01 | Product | First | ref |',
      '| 2026-02-02 | Design | Second | ref |',
    ])
  })

  it('keeps trailing prose below the table intact', () => {
    const withTail = `${doc}\nSome closing note.\n`
    const out = appendRows(withTail, ['| 2026-02-02 | Design | Second | ref |'])
    expect(out.trimEnd().endsWith('Some closing note.')).toBe(true)
  })

  it('is a no-op for no rows', () => {
    expect(appendRows(doc, [])).toBe(doc)
  })

  it('refuses a document with no table', () => {
    expect(() => appendRows('# Nothing here\n', ['| a |'])).toThrow(/no markdown table/)
  })
})

describe('the real decision log', () => {
  it('has a valid, parseable file for every pending entry', () => {
    // This is the test that makes CI fail on a malformed entry.
    expect(() => loadEntries()).not.toThrow()
  })

  it('skips README.md when collecting entries', () => {
    expect(entryFilenames()).not.toContain('README.md')
  })

  it('documents every Kind the code accepts', () => {
    const log = readFileSync(LOG_FILE, 'utf8')
    for (const kind of KINDS) expect(log).toContain(kind)
  })

  it('folds the pending entries without disturbing the existing rows', () => {
    const before = readFileSync(LOG_FILE, 'utf8')
    const rowsBefore = before.split('\n').filter((l) => l.startsWith('| 20'))
    const entries = loadEntries()
    const after = appendRows(before, entries.map((e) => e.row))
    const rowsAfter = after.split('\n').filter((l) => l.startsWith('| 20'))
    expect(rowsAfter.slice(0, rowsBefore.length)).toEqual(rowsBefore)
    expect(rowsAfter).toHaveLength(rowsBefore.length + entries.length)
  })

  it('keeps every entry file in the folder it is read from', () => {
    expect(ENTRIES_DIR.endsWith(join('docs', 'decision-log'))).toBe(true)
  })
})
