import aircraftAtlas from '../assets/aircraft-atlas.webp'
import { extractSprite, type Sprite } from './sprites'

type Kind = 'shuttle' | 'ornithopter' | 'freighter' | 'cruiser'
export type AircraftSprites = Partial<Record<Kind, Sprite>>

export function loadAircraftSprites(sprites: AircraftSprites) {
  const image = new Image()
  let cancelled = false
  image.onload = () => {
    if (cancelled) return
    const w = image.naturalWidth / 2, h = image.naturalHeight / 2
    const kinds: Kind[] = ['shuttle', 'ornithopter', 'freighter', 'cruiser']
    kinds.forEach((kind, i) => { sprites[kind] = extractSprite(image, i % 2 * w, Math.floor(i / 2) * h, w, h) })
  }
  image.src = aircraftAtlas
  return () => { cancelled = true; image.onload = null }
}

function aircraft(ctx: CanvasRenderingContext2D, sprites: AircraftSprites, kind: Kind, x: number, y: number, width: number, time: number, reverse = false, distance = .3, reduced = false) {
  const sprite = sprites[kind]
  if (!sprite) return
  const height = width * sprite.height / sprite.width
  ctx.save()
  ctx.translate(x, y + (reduced ? 0 : Math.sin(time * .7 + x * .003) * (2 + distance * 2)))
  ctx.rotate(reduced ? 0 : Math.sin(time * .42 + x * .002) * .025)
  ctx.scale(reverse ? -1 : 1, 1)
  ctx.globalAlpha *= 1 - distance * .45
  if (distance > .7) ctx.filter = 'blur(.45px) saturate(.7)'
  if (kind === 'ornithopter' && !reduced) {
    // The carbon feather panels flex around the fixed fuselage. The root-to-tip
    // phase lag gives the outer wing its own twist instead of scaling a cross.
    const cols = 48
    for (let i = 0; i < cols; i++) {
      const u = i / cols
      const tip = u < .63 ? (.63 - u) / .63 : (u - .63) / .37
      const beat = Math.sin(time * 8.6 - tip * .85)
      const bend = Math.pow(tip, 1.4) * beat * width * .13
      const sx = u * sprite.width, sw = Math.min(sprite.width / cols + .6, sprite.width - sx)
      ctx.drawImage(sprite.image, sx, 0, sw, sprite.height, (u - .5) * width, -height / 2 + bend, sw / sprite.width * width, height)
    }
  } else ctx.drawImage(sprite.image, -width / 2, -height / 2, width, height)
  ctx.filter = 'none'
  if (kind !== 'ornithopter') {
    const engineX = -width * .4, engineY = height * .17
    const glow = ctx.createRadialGradient(engineX, engineY, 0, engineX, engineY, width * .095)
    glow.addColorStop(0, kind === 'shuttle' ? 'rgba(255,53,181,.23)' : 'rgba(82,204,255,.25)')
    glow.addColorStop(1, 'rgba(35,134,255,0)')
    ctx.fillStyle = glow; ctx.fillRect(engineX - width * .1, engineY - width * .1, width * .2, width * .2)
  }
  ctx.restore()
}

function skylineOcclusion(ctx: CanvasRenderingContext2D) {
  const mask = new Path2D()
  mask.rect(-200, -100, 1840, 1100)
  mask.rect(30, -100, 570, 650)
  mask.moveTo(647, 900); mask.lineTo(647, 185); mask.lineTo(673, 185)
  mask.lineTo(684, 45); mask.lineTo(704, 45); mask.lineTo(715, 199)
  mask.lineTo(741, 199); mask.lineTo(741, 900); mask.closePath()
  mask.rect(1262, 194, 150, 706)
  ctx.clip(mask, 'evenodd')
}

export function drawCityTraffic(ctx: CanvasRenderingContext2D, sprites: AircraftSprites, time: number, pointer: { x: number; y: number }, special: boolean, reduced: boolean, mobile: boolean) {
  const t = reduced ? 0 : time
  // Distant aircraft pass behind the architectural silhouettes and retain the
  // skyline's cool haze. Close lanes have distinct sizes and slower drift.
  ctx.save(); ctx.translate(pointer.x * 9, pointer.y * 5); skylineOcclusion(ctx)
  for (let i = 0; i < (mobile ? 3 : 5); i++) {
    const reverse = i % 2 === 0
    const x = ((890 + i * 309 + t * (reverse ? -15 : 18)) % 1710 + 1710) % 1710 - 130
    aircraft(ctx, sprites, 'shuttle', x, 152 + i * 43, 42 + i % 3 * 13, t, reverse, .88, reduced)
  }
  if (special) aircraft(ctx, sprites, 'cruiser', 1060 + Math.sin(t * .04) * 100, 158, 590, t, true, .44, reduced)
  ctx.restore()
  ctx.save(); ctx.translate(pointer.x * 14, pointer.y * 8)
  aircraft(ctx, sprites, 'freighter', 1650 - (t * 18 + 620) % 2030, 302 + Math.sin(t * .12) * 17, 158, t, true, .55, reduced)
  aircraft(ctx, sprites, 'shuttle', (t * 29 + 1020) % 1840 - 120, 190, 137, t, false, .28, reduced)
  if (!mobile) aircraft(ctx, sprites, 'shuttle', 1700 - (t * 37 + 1410) % 2020, 338, 164, t, true, .16, reduced)
  aircraft(ctx, sprites, 'ornithopter', 1680 - (t * 20 + 440) % 2000, 174 + Math.sin(t * .18) * 15, 170, t, true, .25, reduced)
  ctx.restore()
}
