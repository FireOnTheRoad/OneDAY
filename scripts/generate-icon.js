import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const iconPath = resolve(root, 'resources', 'icon.png')

const sizes = [16, 24, 32, 48, 64, 128, 256]

async function generateIco() {
  const pngBuffers = []
  for (const size of sizes) {
    const buf = await sharp(iconPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    pngBuffers.push({ size, buf })
  }

  const headerSize = 6
  const entrySize = 16
  const numImages = pngBuffers.length
  const dataOffset = headerSize + entrySize * numImages

  let icoData = Buffer.alloc(dataOffset)
  icoData.writeUInt16LE(0, 0)
  icoData.writeUInt16LE(1, 2)
  icoData.writeUInt16LE(numImages, 4)

  let currentOffset = dataOffset
  const pngDataBuffers = []

  for (let i = 0; i < numImages; i++) {
    const { size, buf } = pngBuffers[i]
    const entryOffset = headerSize + i * entrySize

    icoData.writeUInt8(size >= 256 ? 0 : size, entryOffset)
    icoData.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1)
    icoData.writeUInt8(0, entryOffset + 2)
    icoData.writeUInt8(0, entryOffset + 3)
    icoData.writeUInt16LE(1, entryOffset + 4)
    icoData.writeUInt16LE(32, entryOffset + 6)
    icoData.writeUInt32LE(buf.length, entryOffset + 8)
    icoData.writeUInt32LE(currentOffset, entryOffset + 12)

    pngDataBuffers.push(buf)
    currentOffset += buf.length
  }

  icoData = Buffer.concat([icoData, ...pngDataBuffers])

  const icoPath = resolve(root, 'resources', 'icon.ico')
  writeFileSync(icoPath, icoData)
  console.log(`ICO generated: ${icoPath}`)

  const icon256 = await sharp(iconPath)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const icnsPath = resolve(root, 'resources', 'icon.png')
  console.log(`PNG 256x256 ready: ${icnsPath}`)
}

generateIco().catch(console.error)
