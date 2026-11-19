// Validation and folding for the decision log. See docs/DECISION-LOG.md for the
// convention this enforces, and docs/decision-log/README.md for day-to-day use.

/**
 * The kinds a decision may be. Edited here and nowhere else -- DECISION-LOG.md
 * documents this list, and the tests assert the two stay in step.
 *
 * Content became Copy because this project has no content pipeline, but its
 * wording is a real design axis: effort labels, the completion line, the tier
 * hints. Everything else is the default set.
 */
export const KINDS = [
  'Product',
  'Design',
  'Copy',
  'Engineering',
  'Process',
  'Deferred',
  'Reversed',
]

/** `YYYY-MM-DD-short-name.md`, lowercase and hyphenated. */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/

export function isValidFilename(filename) {
  return FILENAME_PATTERN.test(filename)
}

/** The `YYYY-MM-DD` prefix of a valid entry filename. */
export function dateFromFilename(filename) {
  return filename.slice(0, 10)
}

class EntryError extends Error {}

/** A plain message naming the file and what is wrong with it. */
function fail(filename, problem) {
  throw new EntryError(`${filename}: ${problem}`)
}

/**
 * Parses one entry file into a row. An entry holds exactly one table row and
 * nothing else, so that folding is a concatenation and never a merge.
 *
 * Returns { filename, date, kind, decision, ref, row }.
 */
export function parseEntry(filename, contents) {
  if (!isValidFilename(filename)) {
    fail(
      filename,
      'filename must look like YYYY-MM-DD-short-name.md (lowercase, hyphenated)',
    )
  }

  const lines = contents.split('\n').filter((line) => line.trim() !== '')
  if (lines.length === 0) fail(filename, 'file is empty; it must hold one table row')
  if (lines.length > 1) {
    fail(filename, `file must hold exactly one table row, found ${lines.length} lines`)
  }

  const line = lines[0].trim()
  if (!line.startsWith('|') || !line.endsWith('|')) {
    fail(filename, 'row must start and end with "|"')
  }

  // A leading and trailing pipe produce empty first and last fields; drop them.
  const cells = line.slice(1, -1).split('|').map((cell) => cell.trim())
  if (cells.length !== 4) {
    fail(filename, `row must have exactly 4 cells (Date, Kind, Decision, Ref), found ${cells.length}`)
  }

  const [date, kind, decision, ref] = cells
  const expected = dateFromFilename(filename)
  if (date !== expected) {
    fail(filename, `Date cell is "${date}" but the filename says "${expected}"`)
  }
  if (!KINDS.includes(kind)) {
    fail(filename, `Kind "${kind}" is not one of: ${KINDS.join(', ')}`)
  }
  if (!decision) fail(filename, 'Decision cell is empty')
  if (!ref) fail(filename, 'Ref cell is empty')

  return { filename, date, kind, decision, ref, row: `| ${date} | ${kind} | ${decision} | ${ref} |` }
}

/**
 * Filename order, which is date order then name order -- the order entries are
 * folded in, so a fold is reproducible whoever runs it.
 */
export function sortEntries(entries) {
  return [...entries].sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0))
}

/**
 * Appends rows to the end of the last markdown table in `markdown`.
 *
 * Appending to the end is what makes parallel branches safe: two branches that
 * each add a file never touch the same line, and the fold that merges them is
 * a single commit on main.
 */
export function appendRows(markdown, rows) {
  if (rows.length === 0) return markdown

  const lines = markdown.split('\n')
  let lastTableLine = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('|')) lastTableLine = i
  }
  if (lastTableLine === -1) {
    throw new EntryError('no markdown table found to append to')
  }

  lines.splice(lastTableLine + 1, 0, ...rows)
  return lines.join('\n')
}
