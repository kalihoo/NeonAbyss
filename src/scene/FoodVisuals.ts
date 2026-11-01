import type { Food } from './fishAI'

function chip(ctx: CanvasRenderingContext2D) {
  // Gold contacts, a beveled ceramic package, and luminous etched traces.
  ctx.strokeStyle = '#d6b67d'; ctx.lineWidth = .08
  for (let i = 0; i < 5; i++) {
    const v = -.42 + i * .21
    ctx.beginPath(); ctx.moveTo(v, -.58); ctx.lineTo(v, -.86)
    ctx.moveTo(v, .58); ctx.lineTo(v, .86)
    ctx.moveTo(-.58, v); ctx.lineTo(-.86, v)
    ctx.moveTo(.58, v); ctx.lineTo(.86, v); ctx.stroke()
  }
  const body = ctx.createLinearGradient(-.65, -.65, .65, .65)
  body.addColorStop(0, '#496b7c'); body.addColorStop(.23, '#112c43'); body.addColorStop(1, '#071222')
  ctx.fillStyle = body; ctx.fillRect(-.64, -.64, 1.28, 1.28)
  ctx.strokeStyle = '#48e8ff'; ctx.lineWidth = .045; ctx.strokeRect(-.6, -.6, 1.2, 1.2)
  ctx.strokeStyle = '#39b3cf'; ctx.lineWidth = .025
  for (let i = 0; i < 3; i++) {
    const p = i * .14 - .14
    ctx.beginPath(); ctx.moveTo(-.5, p); ctx.lineTo(-.32, p); ctx.lineTo(-.2, p + .12); ctx.lineTo(.08, p + .12); ctx.stroke()
  }
  ctx.fillStyle = '#143f57'; ctx.fillRect(-.24, -.25, .48, .5)
  ctx.strokeStyle = '#a9f7ff'; ctx.strokeRect(-.24, -.25, .48, .5)
  ctx.fillStyle = '#ff66df'; ctx.fillRect(-.12, -.1, .24, .2)
  ctx.fillStyle = '#e9ffff'; ctx.fillRect(.4, -.48, .08, .08)
}

function gpu(ctx: CanvasRenderingContext2D, time: number) {
  const body = ctx.createLinearGradient(0, -.55, 0, .55)
  body.addColorStop(0, '#638696'); body.addColorStop(.15, '#193d56'); body.addColorStop(1, '#080f1e')
  ctx.fillStyle = body; ctx.fillRect(-1.2, -.53, 2.4, 1.06)
  ctx.strokeStyle = '#56d9f0'; ctx.lineWidth = .04; ctx.strokeRect(-1.2, -.53, 2.4, 1.06)
  ctx.fillStyle = '#ac72ff'; ctx.fillRect(-1.08, -.5, 2.16, .065)
  ctx.fillStyle = '#cba365'; ctx.fillRect(-.7, .53, .97, .14)
  ctx.fillStyle = '#24425b'
  for (let i = 0; i < 10; i++) ctx.fillRect(-1.05 + i * .22, -.35, .05, .7)
  for (const x of [-.55, .55]) {
    ctx.save(); ctx.translate(x, 0)
    ctx.fillStyle = '#030e1c'; ctx.beginPath(); ctx.arc(0, 0, .41, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#618a9d'; ctx.lineWidth = .035; ctx.stroke()
    ctx.rotate(time * 4)
    for (let i = 0; i < 7; i++) {
      ctx.rotate(Math.PI * 2 / 7); ctx.fillStyle = '#426d86'
      ctx.beginPath(); ctx.moveTo(.08, -.02); ctx.quadraticCurveTo(.39, -.16, .34, -.02); ctx.lineTo(.14, .12); ctx.closePath(); ctx.fill()
    }
    ctx.fillStyle = '#58f3ff'; ctx.beginPath(); ctx.arc(0, 0, .085, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }
  ctx.fillStyle = '#bccfd8'; ctx.fillRect(-1.32, -.58, .12, 1.16)
}

function gear(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#496779'; ctx.strokeStyle = '#b6d2dc'; ctx.lineWidth = .035
  ctx.beginPath()
  for (let i = 0; i < 48; i++) {
    const a = i * Math.PI / 24, r = i % 4 < 2 ? .87 : .71
    const x = Math.cos(a) * r, y = Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#0c2136'; ctx.beginPath(); ctx.arc(0, 0, .56, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#cf68ff'; ctx.lineWidth = .09; ctx.beginPath(); ctx.arc(0, 0, .49, 0, Math.PI * 2); ctx.stroke()
  ctx.strokeStyle = '#577c95'; ctx.lineWidth = .11
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * .22, Math.sin(a) * .22); ctx.lineTo(Math.cos(a) * .44, Math.sin(a) * .44); ctx.stroke()
  }
  ctx.fillStyle = '#5afff6'; ctx.beginPath(); ctx.arc(0, 0, .2, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#0e3451'; ctx.beginPath(); ctx.arc(0, 0, .09, 0, Math.PI * 2); ctx.fill()
}

export function drawFood(ctx: CanvasRenderingContext2D, food: Food, time: number, w: number, h: number, reduced: boolean, pixelRatio: number) {
  const size = pixelRatio * Math.max(.78, Math.min(1.15, w / pixelRatio / 900)) * (food.kind === 'gpu' ? 17 : 15)
  ctx.save(); ctx.translate(food.x * w, food.y * h)
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2.1)
  glow.addColorStop(0, food.kind === 'gear' ? 'rgba(192,68,255,.19)' : 'rgba(44,218,255,.2)'); glow.addColorStop(1, 'rgba(0,155,255,0)')
  ctx.fillStyle = glow; ctx.fillRect(-size * 2.1, -size * 2.1, size * 4.2, size * 4.2)
  ctx.rotate(food.phase * .4 + (reduced ? 0 : time * (food.kind === 'gear' ? .8 : .25) + Math.sin(time + food.phase) * .18))
  ctx.scale(size, size)
  if (food.kind === 'chip') chip(ctx)
  else if (food.kind === 'gpu') gpu(ctx, reduced ? 0 : time)
  else gear(ctx)
  ctx.restore()
}
