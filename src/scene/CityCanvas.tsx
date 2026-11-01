import { useEffect, useRef } from 'react'
import cityPlate from '../assets/city-night.jpg'
import { drawCityTraffic, loadAircraftSprites, type AircraftSprites } from './AircraftVisuals'

export type Weather = 'rain' | 'fog' | 'dust' | 'clear'
export type DayPhase = 'night' | 'blue' | 'sunset'
type Props = { weather: Weather; dayPhase: DayPhase; special: boolean; pointer: { x: number; y: number } }
type Building = { x: number; y: number; w: number; h: number; seed: number; layer: number; roof: number }
type Drop = { x: number; y: number; z: number; len: number }

const rand = (n: number) => { const v = Math.sin(n * 127.1 + 78.233) * 43758.5453; return v - Math.floor(v) }
const buildings: Building[] = []
for (let layer = 0; layer < 3; layer++) {
  let x = -70
  let i = 0
  while (x < 1530) {
    const w = (layer === 0 ? 40 : layer === 1 ? 62 : 84) + rand(i * 7 + layer * 91) * (layer === 0 ? 39 : 65)
    const h = (layer === 0 ? 170 : layer === 1 ? 235 : 310) + rand(i * 19 + layer * 42) * (layer === 0 ? 195 : 300)
    const y = (layer === 0 ? 535 : layer === 1 ? 625 : 747) - h
    buildings.push({ x, y, w, h, seed: i + layer * 100, layer, roof: rand(i * 37 + layer) })
    x += w * (layer === 0 ? .8 : .94)
    i++
  }
}
const drops: Drop[] = Array.from({ length: 200 }, (_, i) => ({ x: rand(i * 31) * 1440, y: rand(i * 67) * 900, z: .3 + rand(i * 13) * .9, len: 8 + rand(i * 17) * 27 }))

function polygon(ctx: CanvasRenderingContext2D, points: [number, number][], fill: string | CanvasGradient, stroke?: string) {
  ctx.beginPath(); ctx.moveTo(...points[0]); for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill()
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke() }
}

function building(ctx: CanvasRenderingContext2D, b: Building, t: number, warm: number, fog: number) {
  const { x, y, w, h, layer, seed } = b
  const base = layer === 0 ? '#111a29' : layer === 1 ? '#0b1522' : '#090e18'
  ctx.globalAlpha = layer === 0 ? .52 : layer === 1 ? .84 : 1
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = layer === 0 ? '#1d2a3a' : '#142433'; ctx.fillRect(x, y, w * .09, h)
  ctx.fillStyle = '#030810'; ctx.fillRect(x + w * .84, y, w * .16, h)
  ctx.fillStyle = '#1c2a3a'; ctx.fillRect(x, y, w, 4)
  if (b.roof > .58) {
    ctx.strokeStyle = layer === 0 ? '#536071' : '#253c4a'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x + w * .66, y); ctx.lineTo(x + w * .66, y - 17 - b.roof * 26); ctx.stroke()
    ctx.fillStyle = '#ff405b'; ctx.fillRect(x + w * .66 - 2, y - 19 - b.roof * 26, 4, 3)
  }
  if (b.roof < .27 && layer > 0) {
    ctx.fillStyle = '#101f2c'; ctx.fillRect(x + w * .15, y - 16, w * .48, 16)
    ctx.fillStyle = '#213748'; ctx.fillRect(x + w * .21, y - 23, w * .3, 7)
  }
  const cols = Math.max(2, Math.floor(w / 12)), rows = Math.max(5, Math.floor(h / 14))
  for (let row = 1; row < rows; row++) for (let col = 1; col < cols; col++) {
    const r = rand(seed * 903 + row * 27 + col * 117)
    if (r > (layer === 0 ? .52 : .68)) {
      const flicker = rand(seed + row * 4 + col) > .97 ? Math.sin(t * 11 + row) > -.2 : true
      if (!flicker) continue
      ctx.fillStyle = r > .92 ? `rgba(255,122,91,${.38 + warm * .35})` : r > .82 ? 'rgba(0,220,239,.43)' : `rgba(166,197,219,${.14 + (1-fog)*.16})`
      ctx.fillRect(x + col * (w / cols), y + row * (h / rows), layer === 0 ? 2 : 3, layer === 0 ? 4 : 5)
    }
  }
  ctx.globalAlpha = 1
}

function ad(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, sub: string, color: string, t: number) {
  const flicker = Math.sin(t * 5 + x) > .985 ? .35 : 1
  ctx.save(); ctx.globalAlpha = flicker
  ctx.shadowColor = color; ctx.shadowBlur = 23
  ctx.fillStyle = '#070c18'; ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.strokeRect(x, y, w, h)
  ctx.shadowBlur = 11; ctx.fillStyle = color; ctx.font = `700 ${Math.min(24, h * .36)}px "Barlow Condensed", sans-serif`
  ctx.fillText(text, x + 10, y + h * .56, w - 18)
  ctx.font = '9px "IBM Plex Mono", monospace'; ctx.fillStyle = '#acc3d6'; ctx.fillText(sub, x + 11, y + h - 9, w - 20)
  ctx.restore()
}

function holoFigure(ctx:CanvasRenderingContext2D,x:number,y:number,t:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.33+Math.sin(t*2)*.055;ctx.shadowColor='#ff2bd6';ctx.shadowBlur=26
  ctx.strokeStyle='#ff52db';ctx.lineWidth=3
  ctx.beginPath();ctx.ellipse(0,-53,23,31,-.08,0,Math.PI*2);ctx.stroke()
  ctx.beginPath();ctx.moveTo(-23,-23);ctx.quadraticCurveTo(-61,12,-42,89);ctx.moveTo(23,-23);ctx.quadraticCurveTo(58,18,42,89);ctx.moveTo(-41,87);ctx.quadraticCurveTo(0,102,42,87);ctx.stroke()
  ctx.beginPath();ctx.moveTo(-22,-48);ctx.lineTo(20,-48);ctx.stroke()
  ctx.fillStyle='#ff2bd6';ctx.font='700 12px "IBM Plex Mono", monospace';ctx.fillText('DREAM IN COLOR',-62,116)
  ctx.restore()
}

function draw(ctx: CanvasRenderingContext2D, t: number, weather: Weather, day: DayPhase, special: boolean, pointer: {x:number;y:number}, reduced: boolean, plate: HTMLImageElement | null, aircraft: AircraftSprites, mobile: boolean) {
  const warm = weather === 'dust' ? 1 : day === 'sunset' ? .7 : 0
  const fog = weather === 'fog' ? .8 : weather === 'dust' ? .65 : .23
  const sky = ctx.createLinearGradient(0,0,0,900)
  sky.addColorStop(0, weather === 'dust' ? '#442114' : day === 'sunset' ? '#30213a' : day === 'blue' ? '#142344' : '#060c1c')
  sky.addColorStop(.56, weather === 'dust' ? '#97512c' : day === 'sunset' ? '#8a4669' : '#152646')
  sky.addColorStop(1, '#050911'); ctx.fillStyle = sky; ctx.fillRect(0,0,1440,900)
  if(plate?.complete && plate.naturalWidth){
    ctx.drawImage(plate,-80+pointer.x*9,pointer.y*5,1600,900)
    ctx.fillStyle=weather==='dust'?'rgba(117,53,19,.56)':weather==='fog'?'rgba(31,51,92,.37)':day==='blue'?'rgba(21,62,98,.25)':day==='sunset'?'rgba(92,30,53,.20)':'rgba(2,9,24,.13)'
    ctx.fillRect(0,0,1440,900)
  }
  // cloud banks and a distant electrical storm
  for(let i=0;i<9;i++){
    const x= i*230 - 120 + (reduced?0:Math.sin(t*.04+i)*32)
    const y=72 + i%3*51
    const g=ctx.createRadialGradient(x,y,5,x,y,230)
    g.addColorStop(0,weather==='dust'?'rgba(244,127,62,.13)':'rgba(64,87,143,.14)');g.addColorStop(1,'rgba(3,5,14,0)')
    ctx.fillStyle=g;ctx.fillRect(x-230,y-230,460,460)
  }
  if(weather==='clear'){
    ctx.fillStyle='rgba(193,226,255,.55)'; for(let i=0;i<100;i++){const x=rand(i*4)*1440,y=rand(i*11)*410;ctx.fillRect(x,y,rand(i*19)> .9?2:1,1)}
  }
  if(weather==='rain' && Math.sin(t*.37)> .998 && !reduced){ctx.fillStyle='rgba(188,219,255,.16)';ctx.fillRect(0,0,1440,900)}
  // slanted atmospheric shafts behind the skyline
  for(let i=0;i<5;i++){
    const x=105+i*310+Math.sin(t*.14+i)*16
    const beam=ctx.createLinearGradient(x-80,95,x+90,610)
    beam.addColorStop(0,'rgba(0,245,255,0)');beam.addColorStop(.52,weather==='dust'?'rgba(255,176,82,.06)':'rgba(73,183,255,.045)');beam.addColorStop(1,'rgba(0,245,255,0)')
    polygon(ctx,[[x-7,70],[x+3,70],[x+115,650],[x+25,650]],beam)
  }
  // distant tiers
  if(!plate?.complete || !plate.naturalWidth) for(let layer=0;layer<3;layer++){
    ctx.save();ctx.translate(pointer.x*(layer+1)*12,pointer.y*(layer+1)*5)
    for(const b of buildings)if(b.layer===layer)building(ctx,b,t,warm,fog)
    if(layer===0){
      const haze=ctx.createLinearGradient(0,260,0,600);haze.addColorStop(0,'rgba(12,27,55,0)');haze.addColorStop(1,weather==='dust'?'rgba(255,133,65,.34)':'rgba(23,52,83,.33)');ctx.fillStyle=haze;ctx.fillRect(0,250,1440,370)
    }
    if(layer===1){
      ctx.strokeStyle='rgba(55,108,134,.32)';ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(0,526);ctx.bezierCurveTo(400,491,900,565,1440,505);ctx.stroke()
      ctx.strokeStyle='rgba(0,245,255,.17)';ctx.lineWidth=2;ctx.stroke()
      ad(ctx,115,345,136,69,'未来夜市','MIDNIGHT MARKET','#ff2bd6',t)
      ad(ctx,575,266,114,54,'脳機関','NEURAL CLINIC','#00f5ff',t)
      ad(ctx,1109,345,149,62,'SYNTH / 09','DIGITAL SOUL','#e7ff00',t)
      holoFigure(ctx,1278,215,t)
      ad(ctx,1020,234,83,130,'九','FUTURE','#ff2bd6',t)
      ad(ctx,34,294,83,130,'電','CYBERNETICS','#00f5ff',t)
    }
    if(layer===2){
      // suspension rail and elevated access bridge
      ctx.fillStyle='#0b1520';ctx.fillRect(0,612,1440,14);ctx.fillStyle='#153442';ctx.fillRect(0,612,1440,2)
      for(let i=0;i<15;i++){ctx.fillStyle='#142331';ctx.fillRect(i*110+10,623,7,90)}
      ad(ctx,316,437,117,74,'義体研究','BIO // TECH','#087bff',t)
      ad(ctx,776,404,154,66,'NEON EDEN','OPEN ALL NIGHT','#ff1744',t)
      ad(ctx,1289,467,116,61,'未来便利店','24H / 便利','#ff9d42',t)
      ad(ctx,76,508,115,48,'AFTERGLOW','SYNTH BAR','#ff1744',t)
      // towers carry conduits, maintenance ladders and reflected neon
      for(let i=0;i<11;i++){
        const x=90+i*132
        ctx.fillStyle=i%2?'rgba(255,43,214,.06)':'rgba(0,245,255,.055)';ctx.fillRect(x,460,8,260)
        ctx.strokeStyle='rgba(104,154,170,.24)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+12,480);ctx.lineTo(x+12,690);ctx.stroke()
        for(let k=0;k<10;k++){ctx.fillStyle='rgba(103,160,169,.18)';ctx.fillRect(x+9,488+k*19,6,1)}
      }
    }
    ctx.restore()
  }
  if(plate?.complete && plate.naturalWidth){
    // Moving foreground traffic and live signal layers remain independent of the artwork.
    ad(ctx,1181,345,112,56,'新東京','NEON DISTRICT','#ff2bd6',t)
  }
  drawCityTraffic(ctx,aircraft,t,pointer,special,reduced,mobile)
  // deep city traffic and pollution
  const cityFog=ctx.createLinearGradient(0,470,0,900);cityFog.addColorStop(0,'rgba(17,31,53,0)');cityFog.addColorStop(.55,weather==='dust'?'rgba(130,63,33,.23)':'rgba(8,25,43,.12)');cityFog.addColorStop(1,plate?'rgba(3,6,12,.40)':'rgba(3,6,12,.95)');ctx.fillStyle=cityFog;ctx.fillRect(0,470,1440,430)
  for(let i=0;i<50;i++){const x=rand(i*44)*1440,y=620+rand(i*12)*200;ctx.fillStyle=i%4===0?'rgba(255,58,118,.42)':'rgba(0,224,250,.31)';ctx.fillRect(x,y,2+rand(i*7)*5,1)}
  if(weather==='rain' || weather==='fog'){
    const n=weather==='rain'?drops.length:55
    ctx.lineWidth=1
    for(let i=0;i<n;i++){const d=drops[i],x=(d.x+t*(reduced?0:21)*d.z)%1480,y=(d.y+t*(reduced?0:220)*d.z)%950;ctx.strokeStyle=`rgba(155,210,240,${.055+d.z*.11})`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4*d.z,y+d.len);ctx.stroke()}
  }
  if(weather==='dust'){
    ctx.fillStyle='rgba(255,146,57,.11)';ctx.fillRect(0,0,1440,900)
    for(let i=0;i<80;i++){let x=(rand(i*65)*1440+t*(reduced?0:15)*(i%3+1))%1440,y=rand(i*9)*900;ctx.fillStyle='rgba(255,202,111,.2)';ctx.fillRect(x,y,2,1)}
  }
  if(special){ctx.fillStyle='rgba(122,9,93,.17)';ctx.fillRect(0,0,1440,900)}
  // architectural window frame and interior shadow
  ctx.fillStyle='#02050a';ctx.fillRect(0,0,31,900);ctx.fillRect(1409,0,31,900);ctx.fillRect(0,0,1440,28)
  ctx.fillStyle='#0f1c29';ctx.fillRect(28,0,9,900);ctx.fillRect(1404,0,9,900)
  ctx.fillStyle='rgba(0,240,255,.14)';ctx.fillRect(35,0,1,900);ctx.fillRect(1404,0,1,900)
  ctx.fillStyle='#050810';ctx.fillRect(0,833,1440,67)
  const floor=ctx.createLinearGradient(0,815,0,900);floor.addColorStop(0,'#1b2b37');floor.addColorStop(.08,'#09131e');floor.addColorStop(1,'#04070d');ctx.fillStyle=floor;ctx.fillRect(0,807,1440,93)
  ctx.fillStyle='rgba(0,245,255,.13)';ctx.fillRect(0,812,1440,2)
}

export default function CityCanvas({ weather, dayPhase, special, pointer }: Props) {
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const propsRef=useRef({weather,dayPhase,special,pointer})
  propsRef.current={weather,dayPhase,special,pointer}
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return
    const plate=new Image();plate.src=cityPlate
    const aircraft:AircraftSprites={}
    const disposeAircraft=loadAircraftSprites(aircraft)
    let frame=0,last=0,elapsed=0
    let priorKey=`${propsRef.current.weather}-${propsRef.current.dayPhase}-${propsRef.current.special}`
    let transitionImage:HTMLCanvasElement|null=null, transitionStart=0
    const media=window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced=media.matches
    const updateMotion=()=>{reduced=media.matches}
    media.addEventListener('change',updateMotion)
    const resize=()=>{const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr)}
    resize();const observer=new ResizeObserver(resize);observer.observe(canvas)
    const loop=(now:number)=>{
      frame=requestAnimationFrame(loop)
      if(document.hidden)return
      if(now-last < (reduced?100:30))return
      elapsed+=Math.min((now-last)/1000,.05);last=now
      const w=canvas.width,h=canvas.height,scale=Math.max(w/1440,h/900)
      const key=`${propsRef.current.weather}-${propsRef.current.dayPhase}-${propsRef.current.special}`
      if(key!==priorKey){transitionImage=document.createElement('canvas');transitionImage.width=w;transitionImage.height=h;transitionImage.getContext('2d')?.drawImage(canvas,0,0);transitionStart=now;priorKey=key}
      ctx.setTransform(scale,0,0,scale,(w-1440*scale)/2,(h-900*scale)/2)
      draw(ctx,elapsed,propsRef.current.weather,propsRef.current.dayPhase,propsRef.current.special,propsRef.current.pointer,reduced,plate,aircraft,canvas.clientWidth<600)
      if(transitionImage){const opacity=1-(now-transitionStart)/1600;if(opacity<=0)transitionImage=null;else{ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=opacity;ctx.drawImage(transitionImage,0,0,w,h);ctx.globalAlpha=1}}
    }
    frame=requestAnimationFrame(loop)
    return()=>{cancelAnimationFrame(frame);observer.disconnect();media.removeEventListener('change',updateMotion);disposeAircraft()}
  },[])
  return <canvas ref={canvasRef} className="city-canvas" aria-hidden="true" />
}
