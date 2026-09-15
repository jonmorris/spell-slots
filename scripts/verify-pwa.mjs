// End-to-end checks that unit tests cannot cover: that the built app installs as
// a PWA, runs with the network switched off, and rolls the day over on its own.
// Run: npm run build && npm run verify
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 4179
// Honour BASE_PATH so a subpath deploy (GitHub Pages serves a project site from
// /<repo>/) can be verified exactly as it will be served.
const BASE = process.env.BASE_PATH ?? '/'
const ORIGIN = `http://localhost:${PORT}${BASE}`
const CHROMIUM = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
].find((p) => p && existsSync(p))

const results = []
const check = (name, ok) => results.push([name, Boolean(ok)])

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
  stdio: 'ignore',
  detached: false,
})

async function waitForServer(attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(ORIGIN)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('preview server never came up')
}

const dayKeyIn = (page) =>
  page.evaluate(() => {
    const d = new Date()
    d.setHours(d.getHours() - 4)
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  })

const read = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('spell-slots/v1')))

let browser
try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: CHROMIUM })

  /* ---------- the day rolls over on its own ---------- */
  {
    const context = await browser.newContext({ viewport: { width: 400, height: 860 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(ORIGIN, { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /Empty 1st-tier slot/ }).first().click()
    await page.getByRole('button', { name: /The one thing that matters today/ }).click()
    await page.getByRole('button', { name: /Move your body/ }).first().click()
    await page.getByRole('button', { name: /The one thing that matters today/ }).first().click()
    await page.waitForTimeout(400)

    const before = await read(page)
    check('a finished day is marked complete', before.today.complete)

    // Backdate the save so the next load looks like waking up two days later.
    await page.evaluate(() => {
      const key = 'spell-slots/v1'
      const s = JSON.parse(localStorage.getItem(key))
      const old = new Date()
      old.setDate(old.getDate() - 2)
      const p = (n) => String(n).padStart(2, '0')
      s.today.date = `${old.getFullYear()}-${p(old.getMonth() + 1)}-${p(old.getDate())}`
      localStorage.setItem(key, JSON.stringify(s))
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const after = await read(page)
    const today = await dayKeyIn(page)
    check('XP is banked at the long rest', after.xpBanked === before.xpBanked + before.today.xpEarned)
    check('the finished day is filed in history', after.history.length === 1)
    check('the new day is today', after.today.date === today)
    check('the streak is recorded', after.streak === 1)
    check(
      'rituals are re-prepared, unfinished',
      after.today.prepared.length === 3 && after.today.prepared.every((p) => !p.done),
    )
    check('fresh slots are laid out', (await page.locator('.day-line').textContent()) === '0 of 2 slots spent')
    check('no page errors during rollover', errors.length === 0)
    await context.close()
  }

  /* ---------- it installs, and runs with the network off ---------- */
  {
    const context = await browser.newContext({ viewport: { width: 400, height: 860 } })
    const page = await context.newPage()
    await page.goto(ORIGIN, { waitUntil: 'networkidle' })

    const controlling = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((r) =>
          navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }),
        )
      }
      return Boolean(reg.active)
    })
    check('the service worker is active and controlling', controlling)

    const manifest = await page.evaluate(async () =>
      (await fetch(document.querySelector('link[rel=manifest]').href)).json(),
    )
    check('the manifest is named', manifest.name === 'Spell Slots')
    check('it is installable standalone', manifest.display === 'standalone')
    check('it ships a maskable icon', manifest.icons.some((i) => i.purpose === 'maskable'))
    check(
      'it ships 192 and 512 icons',
      ['192x192', '512x512'].every((s) => manifest.icons.some((i) => i.sizes === s)),
    )

    await page.getByRole('button', { name: /Move your body/ }).first().click()
    await page.waitForTimeout(300)
    await context.setOffline(true)
    await page.reload({ waitUntil: 'load' })
    await page.waitForTimeout(800)

    check('it renders with the network off', (await page.locator('.day-line').textContent()) === '1 of 2 slots spent')
    check(
      'progress survives an offline reload',
      (await page.locator('.slot.spent .slot-name').first().textContent()) === 'Move your body',
    )
    await context.close()
  }
} finally {
  await browser?.close()
  server.kill()
}

for (const [name, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
