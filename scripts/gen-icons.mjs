import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dirname, '../public/icon.svg'), 'utf8')

for (const size of [192, 512]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render()
  writeFileSync(join(__dirname, `../public/icon-${size}.png`), png.asPng())
  console.log(`✓ icon-${size}.png (${size}x${size})`)
}
