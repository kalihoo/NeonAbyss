import type { Fish, FishKind } from './fishAI'
import type { Sprite } from './sprites'
import { loadSprite } from './sprites'
import goldfish from '../assets/fish-goldfish.webp'
import koi from '../assets/fish-koi.webp'
import tetra from '../assets/fish-tetra.webp'
import angelfish from '../assets/fish-angelfish.webp'
import betta from '../assets/fish-betta.webp'
import arowana from '../assets/fish-arowana.webp'
import danio from '../assets/fish-danio.webp'
import catfish from '../assets/fish-catfish.webp'
import discus from '../assets/fish-discus.webp'

const sources: Record<FishKind, string> = { goldfish, koi, tetra, angelfish, betta, arowana, danio, catfish, discus }
export type FishSprites = Partial<Record<Fish['kind'], Sprite>>

export function loadFishSprites(sprites: FishSprites) {
  const cancel = Object.entries(sources).map(([kind, url]) => loadSprite(url, sprite => { sprites[kind as FishKind] = sprite }, true))
  return () => cancel.forEach(dispose => dispose())
}

export function drawFish(ctx: CanvasRenderingContext2D, fish: Fish, time: number, w: number, h: number, sprites: FishSprites, reduced: boolean, pulse: number, effectTime: number) {
  const sprite = sprites[fish.kind]
  if (!sprite) return
  const { width: sw, height: sh } = sprite
  const custom = fish.kind.startsWith('custom:')
  const length = (custom ? 145 + fish.size * 72 : 128 + fish.size * 104) * (.79 + fish.depth * .24) * w / 1250
  const height = custom ? Math.min(length * .7, length * sh / sw) : length * sh / sw
  const drawWidth = custom && height < length * sh / sw ? height * sw / sh : length
  const glitchWidth = custom ? drawWidth : length
  const heading = Math.cos(fish.angle)
  const facing = heading >= 0 ? 1 : -1
  // Mirror side profiles when turning; roll is always bounded so a leftward
  // fish cannot swim upside-down as it did with full-body angle rotation.
  const pitch = Math.max(-.27, Math.min(.27, Math.sin(fish.angle) * .24))
  const yaw = .42 + Math.abs(heading) * .58
  const phase = time * (4.5 + Math.hypot(fish.vx, fish.vy) * 28) + fish.phase
  const cycle = (effectTime + fish.id * 1.37) % 12
  const glitch = !reduced && (cycle > 7.3 && cycle < 7.48 || pulse > 0 && (time * 12 + fish.id) % 7 < .5)

  ctx.save()
  ctx.translate(fish.x * w, fish.y * h + Math.sin(time * 1.6 + fish.phase) * height * .018)
  ctx.rotate(pitch * facing)
  ctx.scale(facing * yaw, 1)
  ctx.globalAlpha = .68 + fish.depth * .3

  if (glitch) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha *= .5
    ctx.drawImage(sprite.cyan!, -glitchWidth / 2 - glitchWidth * .024, -height / 2, glitchWidth, height)
    ctx.drawImage(sprite.magenta!, -glitchWidth / 2 + glitchWidth * .024, -height / 2, glitchWidth, height)
    ctx.restore()
  }

  if (custom) {
    // Uploaded artwork keeps its original silhouette and aspect ratio; only a
    // soft swim bob and directional mirror are applied so photos do not warp.
    ctx.save()
    ctx.globalAlpha *= .94
    ctx.shadowColor = 'rgba(27, 238, 255, .72)'
    ctx.shadowBlur = reduced ? 4 : 9 + Math.sin(phase) * 2
    ctx.drawImage(sprite.image, -drawWidth / 2, -height / 2, drawWidth, height)
    ctx.restore()
  } else {
    // Continuous tail-to-body mesh. Deformation decays toward the head, keeping
    // the eye, gill core, and body volume stable while fin rays undulate.
    const columns = w < 950 ? 28 : 44
    for (let col = 0; col < columns; col++) {
      const u = col / columns
      const tail = Math.pow(1 - u, 2.2)
      const wave = reduced ? 0 : Math.sin(phase - u * 4.2)
      const dy = wave * tail * length * .033
      const scaleY = 1 + wave * tail * .065
      const sx = sw * u, slice = Math.min(sw / columns + .9, sw - sx)
      ctx.drawImage(sprite.image, sx, 0, slice, sh, (u - .5) * length, -height * scaleY / 2 + dy, slice * length / sw, height * scaleY)
    }
  }

  if (glitch) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 3; i++) {
      const y = ((time * 3 + i * .29 + fish.phase) % .86) * sh
      const strip = sh * .018
      ctx.globalAlpha = .5
      ctx.drawImage(i % 2 ? sprite.cyan! : sprite.magenta!, 0, y, sw, strip, -glitchWidth / 2 + Math.sin(time * 70 + i) * glitchWidth * .05, (y / sh - .5) * height, glitchWidth, strip / sh * height)
    }
    ctx.restore()
  }
  ctx.restore()
}
