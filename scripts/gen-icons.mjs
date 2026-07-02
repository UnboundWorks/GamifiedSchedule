// One-off icon generator: rasterizes public/favicon.svg into the PNG sizes the
// PWA manifest needs. Run with `node scripts/gen-icons.mjs`.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = join(root, 'public', 'favicon.svg')
const iconsDir = join(root, 'public', 'icons')

await mkdir(iconsDir, { recursive: true })

async function render(size, out, background) {
  let img = sharp(svg, { density: 384 }).resize(size, size)
  if (background) img = img.flatten({ background })
  await img.png().toFile(out)
  console.log('wrote', out)
}

await render(192, join(iconsDir, 'icon-192.png'))
await render(512, join(iconsDir, 'icon-512.png'))
// Maskable: add safe padding by rendering the art smaller on a solid bg.
await sharp(svg, { density: 384 })
  .resize(410, 410)
  .extend({
    top: 51,
    bottom: 51,
    left: 51,
    right: 51,
    background: '#4338ca',
  })
  .png()
  .toFile(join(iconsDir, 'icon-maskable-512.png'))
console.log('wrote maskable')
await render(180, join(root, 'public', 'apple-touch-icon.png'), '#4338ca')
console.log('done')
