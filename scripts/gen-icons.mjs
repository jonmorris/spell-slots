// Draws the app icon procedurally and writes real PNGs, with no image
// dependency to install or binary blobs to review. Run: npm run icons
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

/* ---------------- minimal PNG encoder ---------------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const head = Buffer.alloc(4)
  head.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([head, body, crc])
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // truecolour with alpha
  // Each scanline is prefixed with filter type 0; deflate does the rest.
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------------- drawing ---------------- */

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * clamp(t))

/** Smooth 0..1 ramp, used everywhere instead of hard edges so nothing aliases. */
const smooth = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Paints `color` over `dst` with coverage `alpha`. */
function over(dst, color, alpha) {
  return mix(dst, color, alpha)
}

/** Signed distance to a rounded rectangle, for the tile edge. */
function roundedRectSdf(px, py, halfW, halfH, radius) {
  const qx = Math.abs(px) - halfW + radius
  const qy = Math.abs(py) - halfH + radius
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  return outside + Math.min(Math.max(qx, qy), 0) - radius
}

const BG_TOP = [32, 25, 68]
const BG_BOTTOM = [10, 8, 20]
const VIOLET = [139, 92, 246]
const GOLD = [245, 194, 107]
const AMBER = [217, 138, 40]
const HOT = [255, 250, 235]

/**
 * Three slots in a row: two burning, one still hollow. The icon says what the
 * app is -- a finite, visibly countable supply -- rather than just glowing.
 * `maskable` fills the square and pulls the row into the safe zone.
 */
function draw(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const half = size / 2
  const tileHalf = maskable ? half : half * 0.94
  const corner = maskable ? 0 : size * 0.225

  const scale = maskable ? 0.74 : 1
  const orbR = size * 0.118 * scale
  const spacing = size * 0.275 * scale
  const orbs = [
    { x: -spacing, lit: true },
    { x: 0, lit: true },
    { x: spacing, lit: false },
  ]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x + 0.5 - half
      const cy = y + 0.5 - half

      let color = mix(BG_TOP, BG_BOTTOM, (y / size) * 1.2)
      // A single soft violet wash behind the row, kept low so the tile stays
      // indigo instead of going muddy.
      const wash = Math.exp(-(cx * cx + cy * cy * 2.4) / (size * size * 0.06))
      color = over(color, VIOLET, wash * 0.3)

      for (const orb of orbs) {
        const d = Math.hypot(cx - orb.x, cy) / orbR

        if (orb.lit) {
          const bloom = d > 1 ? Math.exp(-Math.pow((d - 1) / 0.42, 2)) : 0
          color = over(color, GOLD, bloom * 0.34)
          const body = 1 - smooth(0.94, 1.02, d)
          const core = mix(HOT, GOLD, smooth(0.0, 0.55, d))
          color = over(color, mix(core, AMBER, smooth(0.5, 1.0, d)), body)
          const rim = Math.exp(-Math.pow((d - 0.93) / 0.09, 2))
          color = over(color, HOT, rim * 0.4 * body)
        } else {
          // Hollow: a violet ring with a barely-there interior.
          const ring = (1 - smooth(0.92, 1.02, d)) * smooth(0.62, 0.74, d)
          color = over(color, mix(VIOLET, HOT, 0.25), ring)
          const inner = 1 - smooth(0.6, 0.7, d)
          color = over(color, VIOLET, inner * 0.16)
        }
      }

      // Tile alpha last, so the rounded corner cuts everything cleanly.
      const edge = roundedRectSdf(cx, cy, tileHalf, tileHalf, corner)
      const alpha = maskable ? 1 : 1 - smooth(-1, 1, edge)

      const i = (y * size + x) * 4
      rgba[i] = Math.round(clamp(color[0], 0, 255))
      rgba[i + 1] = Math.round(clamp(color[1], 0, 255))
      rgba[i + 2] = Math.round(clamp(color[2], 0, 255))
      rgba[i + 3] = Math.round(alpha * 255)
    }
  }
  return encodePng(size, size, rgba)
}

mkdirSync(OUT, { recursive: true })
const files = [
  ['icon-192.png', draw(192)],
  ['icon-512.png', draw(512)],
  ['maskable-512.png', draw(512, { maskable: true })],
  ['apple-touch-icon.png', draw(180, { maskable: true })],
]
for (const [name, buffer] of files) {
  writeFileSync(resolve(OUT, name), buffer)
  console.log(`${name.padEnd(22)} ${(buffer.length / 1024).toFixed(1)} KB`)
}
