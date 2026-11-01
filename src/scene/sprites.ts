export type Sprite = {
  image: HTMLCanvasElement
  cyan?: HTMLCanvasElement
  magenta?: HTMLCanvasElement
  width: number
  height: number
}

function tint(image: HTMLCanvasElement, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

// Extract and trim once on decode. No pixel reads, filters, or canvas allocations
// are needed in the animation loop, including the chromatic ghost passes.
export function loadSprite(url: string, onLoad: (sprite: Sprite) => void, chromatic = false) {
  const image = new Image()
  let cancelled = false
  image.onload = () => {
    if (cancelled) return
    onLoad(extractSprite(image, 0, 0, image.naturalWidth, image.naturalHeight, chromatic))
  }
  image.src = url
  return () => { cancelled = true; image.onload = null }
}

export function extractSprite(image: HTMLImageElement, x: number, y: number, width: number, height: number, chromatic = false): Sprite {
  const source = document.createElement('canvas')
  source.width = Math.round(width)
  source.height = Math.round(height)
  const ctx = source.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, x, y, width, height, 0, 0, source.width, source.height)
  const pixels = ctx.getImageData(0, 0, source.width, source.height).data
  let left = source.width, top = source.height, right = 0, bottom = 0
  for (let py = 0; py < source.height; py++) for (let px = 0; px < source.width; px++) {
    if (pixels[(py * source.width + px) * 4 + 3] < 20) continue
    left = Math.min(left, px); right = Math.max(right, px)
    top = Math.min(top, py); bottom = Math.max(bottom, py)
  }
  if (left > right) { left = 0; top = 0; right = source.width - 1; bottom = source.height - 1 }
  const canvas = document.createElement('canvas')
  canvas.width = right - left + 1
  canvas.height = bottom - top + 1
  canvas.getContext('2d')!.drawImage(source, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
  return { image: canvas, width: canvas.width, height: canvas.height, cyan: chromatic ? tint(canvas, '#24f2ff') : undefined, magenta: chromatic ? tint(canvas, '#ff23bf') : undefined }
}
