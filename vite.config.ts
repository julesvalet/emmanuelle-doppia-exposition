import { closeSync, openSync, readSync, readdirSync } from 'node:fs'
import { resolve, relative, extname } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const ASSETS_DIR = resolve(process.cwd(), 'public', 'media')
const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.mp4', '.webm'])
const EXCLUDED_FILES = new Set(['ED Emmanuelle Doppia Logo Blanc.png'])
const VIRTUAL_ID = 'virtual:gallery-assets'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

type ImageInfo = { width: number; height: number; orientation: 'portrait' | 'landscape' | 'square' }

function readJpegInfo(file: string): ImageInfo {
  const descriptor = openSync(file, 'r')
  const buffer = Buffer.alloc(512 * 1024)
  let bytesRead = 0
  try {
    bytesRead = readSync(descriptor, buffer, 0, buffer.length, 0)
  } finally {
    closeSync(descriptor)
  }

  let width = 0
  let height = 0
  let exifOrientation = 1
  let offset = 2
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

  while (offset + 4 < bytesRead) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }
    while (buffer[offset] === 0xff) offset += 1
    const marker = buffer[offset]
    offset += 1
    if (marker === 0xd8 || marker === 0x01) continue
    if (marker === 0xd9 || marker === 0xda || offset + 2 >= bytesRead) break
    const segmentLength = buffer.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > bytesRead) break

    if (sofMarkers.has(marker) && offset + 7 < bytesRead) {
      height = buffer.readUInt16BE(offset + 3)
      width = buffer.readUInt16BE(offset + 5)
    }

    if (marker === 0xe1 && buffer.toString('ascii', offset + 2, offset + 8) === 'Exif\0\0') {
      const tiff = offset + 8
      const littleEndian = buffer.toString('ascii', tiff, tiff + 2) === 'II'
      const read16 = (position: number) => littleEndian ? buffer.readUInt16LE(position) : buffer.readUInt16BE(position)
      const read32 = (position: number) => littleEndian ? buffer.readUInt32LE(position) : buffer.readUInt32BE(position)
      const ifd = tiff + read32(tiff + 4)
      if (ifd + 2 < bytesRead) {
        const count = read16(ifd)
        for (let index = 0; index < count; index += 1) {
          const entry = ifd + 2 + index * 12
          if (entry + 12 > bytesRead) break
          if (read16(entry) === 274) {
            exifOrientation = read16(entry + 8)
            break
          }
        }
      }
    }

    offset += segmentLength
    if (width && height && exifOrientation !== 1) break
  }

  if ([5, 6, 7, 8].includes(exifOrientation)) [width, height] = [height, width]
  const difference = Math.abs(width - height) / Math.max(width, height, 1)
  const orientation = difference < 0.04 ? 'square' : width > height ? 'landscape' : 'portrait'
  return { width, height, orientation }
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = resolve(directory, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

function mediaOrder(first: string, second: string) {
  const details = (file: string) => {
    const path = relative(ASSETS_DIR, file).replaceAll('\\', '/')
    const parts = path.split('/')
    const stem = parts.at(-1)!.slice(0, -extname(file).length)
    const normalized = stem.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const numbers = normalized.match(/\d+/g)
    return {
      folder: parts[0],
      series: normalized.replace(/\d+/g, '').replace(/[^a-z]+/g, ''),
      number: Number(numbers?.at(-1) ?? Number.MAX_SAFE_INTEGER),
      path,
    }
  }
  const a = details(first)
  const b = details(second)
  return a.folder.localeCompare(b.folder, 'fr', { sensitivity: 'base' })
    || a.series.localeCompare(b.series, 'fr', { sensitivity: 'base' })
    || a.number - b.number
    || a.path.localeCompare(b.path, 'fr', { sensitivity: 'base' })
}

function galleryAssetsPlugin(): Plugin {
  return {
    name: 'gallery-assets',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined
      const files = walk(ASSETS_DIR)
        .filter((file) => MEDIA_EXTENSIONS.has(extname(file).toLowerCase()))
        .filter((file) => !EXCLUDED_FILES.has(relative(ASSETS_DIR, file)))
        .sort(mediaOrder)
        .map((file) => {
          const path = relative(ASSETS_DIR, file).replaceAll('\\', '/')
          const extension = extname(file).toLowerCase()
          const type = ['.mp4', '.webm'].includes(extension) ? 'video' : 'image'
          const dimensions = ['.jpg', '.jpeg'].includes(extension) ? readJpegInfo(file) : { width: 0, height: 0, orientation: 'landscape' as const }
          const title = path
            .slice(0, -extension.length)
            .split('/')
            .at(-1)!
            .replace(/^\d+[-_ ]*/, '')
            .replaceAll(/[-_]+/g, ' ')
          return {
            src: path.split('/').map(encodeURIComponent).join('/'),
            path,
            folder: path.split('/')[0],
            type,
            title,
            ...dimensions,
          }
        })
      return `export default ${JSON.stringify(files)}.map((item) => ({
        ...item,
        src: import.meta.env.BASE_URL + 'media/' + item.src,
        mobileSrc: import.meta.env.BASE_URL + 'media-mobile/' + item.src,
      }))`
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(ASSETS_DIR)) return
      const module = server.moduleGraph.getModuleById(RESOLVED_ID)
      if (module) server.moduleGraph.invalidateModule(module)
    },
  }
}

export default defineConfig({
  plugins: [react(), galleryAssetsPlugin()],
  publicDir: 'public',
  base: './',
  build: { target: 'es2022' },
})
