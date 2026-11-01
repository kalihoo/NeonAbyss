import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { addFood, createFish, stepFish, type Attraction, type Fish, type Food, type Vec } from './fishAI'
import reefPlate from '../assets/reef-interior.jpg'
import { WaterMotion } from './RemotionEffects'

export type AquariumHandle = { feed: () => void }
type Ripple = Vec & { radius: number; alpha: number }
type Bubble = Vec & { size: number; speed: number; phase: number }

const fishColors: Record<Fish['kind'], [string,string,string]> = {
  ember:['#ffca69','#f36b2f','#873337'], koi:['#ffecc3','#e58243','#e5e5dc'],
  silver:['#f4fbff','#91b9cf','#567b9c'], shadow:['#f8bc6d','#3e5264','#131a2e'],
  cyber:['#a5fbff','#22b5d2','#684fd4']
}

function drawFish(ctx: CanvasRenderingContext2D, f: Fish, time: number, w: number, h: number) {
  const s=(18+f.size*24)*(.78+f.depth*.38)*Math.max(.9,w/850)
  ctx.save();ctx.translate(f.x*w,f.y*h);ctx.rotate(f.angle);ctx.scale(s,s)
  ctx.globalAlpha=.62+f.depth*.38
  const [light,main,dark]=fishColors[f.kind]
  const wave=Math.sin(time*7.4+f.phase)*.22
  // far pectoral fin
  ctx.save();ctx.rotate(Math.sin(time*5+f.phase)*.14);ctx.fillStyle=dark;ctx.globalAlpha*=.65
  ctx.beginPath();ctx.moveTo(-.18,.12);ctx.quadraticCurveTo(-.35,.55,-.03,.57);ctx.quadraticCurveTo(.15,.27,-.18,.12);ctx.fill();ctx.restore()
  // large articulated tail
  ctx.save();ctx.translate(-.72,0);ctx.rotate(wave)
  const tg=ctx.createLinearGradient(-.9,0,0,0);tg.addColorStop(0,dark);tg.addColorStop(.4,main);tg.addColorStop(1,light)
  ctx.fillStyle=tg;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-.3,-.12,-.47,-.69,-.91,-.71);ctx.quadraticCurveTo(-.64,-.15,-.69,0);ctx.quadraticCurveTo(-.6,.22,-.93,.74);ctx.bezierCurveTo(-.48,.72,-.2,.1,0,0);ctx.fill()
  ctx.strokeStyle=light;ctx.lineWidth=.014;ctx.globalAlpha=.5
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-.84, i*.31);ctx.stroke()}
  ctx.restore()
  // dorsal fin
  ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-.36,-.24);ctx.quadraticCurveTo(-.33,-.67,-.04,-.75);ctx.quadraticCurveTo(.15,-.6,.25,-.36);ctx.fill()
  // body volume
  const g=ctx.createRadialGradient(.18,-.21,.05,-.08,.13,.95);g.addColorStop(0,light);g.addColorStop(.42,main);g.addColorStop(1,dark)
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-.8,0);ctx.bezierCurveTo(-.55,-.35,.35,-.49,.85,-.17);ctx.quadraticCurveTo(1.08,0,.85,.17);ctx.bezierCurveTo(.35,.49,-.55,.35,-.8,0);ctx.fill()
  if(f.kind==='koi'||f.kind==='shadow'){
    ctx.fillStyle=f.kind==='koi'?'#6e4044':'#101421';ctx.globalAlpha=.7
    ctx.beginPath();ctx.ellipse(-.29,-.13,.21,.11,-.2,0,Math.PI*2);ctx.fill()
    ctx.beginPath();ctx.ellipse(.24,.22,.16,.09,.25,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1
  }
  if(f.kind==='cyber'){
    ctx.strokeStyle='#00f5ff';ctx.lineWidth=.025;ctx.shadowColor='#00f5ff';ctx.shadowBlur=.17
    ctx.beginPath();ctx.moveTo(-.6,0);ctx.lineTo(.52,0);ctx.stroke();ctx.shadowBlur=0
  }
  // near fin and gill
  ctx.fillStyle=main;ctx.globalAlpha=.82
  ctx.save();ctx.translate(.13,.18);ctx.rotate(Math.sin(time*9+f.phase)*.22)
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-.2,.44,.12,.57);ctx.quadraticCurveTo(.28,.27,0,0);ctx.fill();ctx.restore()
  ctx.strokeStyle='rgba(46,31,37,.42)';ctx.lineWidth=.025;ctx.beginPath();ctx.arc(.48,0,.17,-1.1,1.12);ctx.stroke()
  ctx.fillStyle='#101622';ctx.beginPath();ctx.arc(.66,-.13,.065,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(.677,-.15,.018,0,Math.PI*2);ctx.fill()
  ctx.restore()
}

function plant(ctx:CanvasRenderingContext2D,x:number,h:number,t:number,color:string,phase:number){
  ctx.save();ctx.translate(x,h);ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineWidth=2.3
  for(let i=0;i<4;i++){
    const xend=Math.sin(t*.7+phase+i)*7+i*9-14
    const height=45+i*16+(phase%3)*9
    ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(xend-11,-height*.3,xend+12,-height*.65,xend,-height);ctx.stroke()
    ctx.fillStyle=color;ctx.globalAlpha=.42
    for(let j=1;j<4;j++){
      const py=-height*j/4,px=xend*j/4
      ctx.beginPath();ctx.ellipse(px+(j%2?7:-7),py,11,4,j%2?-.5:.5,0,Math.PI*2);ctx.fill()
    }
    ctx.globalAlpha=1
  }
  ctx.restore()
}

const Aquarium=forwardRef<AquariumHandle>(function Aquarium(_,ref){
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const fish=useRef(createFish())
  const food=useRef<Food[]>([])
  const pointer=useRef<Vec|null>(null)
  const attraction=useRef<Attraction|null>(null)
  const ripples=useRef<Ripple[]>([])
  const bubbles=useRef<Bubble[]>(Array.from({length:30},(_,i)=>({x:.08+(i*37%87)/100,y:(i*31%100)/100,size:1+i%3,speed:.025+(i%5)*.009,phase:i*1.3})))
  useImperativeHandle(ref,()=>({feed:()=>{addFood(food.current);ripples.current.push({x:.5,y:.06,radius:.02,alpha:.7})}}),[])

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const ctx=canvas.getContext('2d');if(!ctx)return
    const reef=new Image();reef.src=reefPlate
    let frame=0,last=0,time=0
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize=()=>{const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(canvas.clientWidth*dpr);canvas.height=Math.round(canvas.clientHeight*dpr)}
    resize();const observer=new ResizeObserver(resize);observer.observe(canvas)
    const loop=(now:number)=>{
      frame=requestAnimationFrame(loop)
      if(document.hidden)return
      const dt=Math.min((now-last)/1000,.05);if(now-last<(reduced?80:16))return;last=now;time+=dt
      const w=canvas.width,h=canvas.height;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h)
      const water=ctx.createLinearGradient(0,0,0,h);water.addColorStop(0,'#0c425b');water.addColorStop(.26,'#092a43');water.addColorStop(.68,'#071e34');water.addColorStop(1,'#081322');ctx.fillStyle=water;ctx.fillRect(0,0,w,h)
      if(reef.complete&&reef.naturalWidth){const aspect=w/h,sourceAspect=reef.naturalWidth/reef.naturalHeight;const sw=aspect>sourceAspect?reef.naturalWidth:reef.naturalHeight*aspect,sh=aspect>sourceAspect?reef.naturalWidth/aspect:reef.naturalHeight;ctx.drawImage(reef,(reef.naturalWidth-sw)/2,(reef.naturalHeight-sh)/2,sw,sh,0,0,w,h);ctx.fillStyle='rgba(0,17,33,.21)';ctx.fillRect(0,0,w,h)}
      const light=ctx.createRadialGradient(w*.56,h*.02,2,w*.56,h*.12,w*.72);light.addColorStop(0,'rgba(106,236,255,.32)');light.addColorStop(.5,'rgba(20,108,168,.11)');light.addColorStop(1,'rgba(0,7,24,0)');ctx.fillStyle=light;ctx.fillRect(0,0,w,h)
      ctx.strokeStyle='rgba(154,247,255,.24)';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=w;x+=5){const y=h*.055+Math.sin(x*.018+time*.9)*2; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()
      // submerged shafts and caustic shimmer
      for(let i=0;i<4;i++){const x=w*(.18+i*.24)+Math.sin(time*.32+i)*w*.03;const shaft=ctx.createLinearGradient(x-60,0,x+130,h);shaft.addColorStop(0,'rgba(74,220,255,.09)');shaft.addColorStop(1,'rgba(0,154,210,0)');ctx.fillStyle=shaft;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+w*.14,h);ctx.lineTo(x+w*.26,h);ctx.lineTo(x+w*.08,0);ctx.fill()}
      // biomaterial and ground
      if(!reef.complete||!reef.naturalWidth){
      const ground=ctx.createLinearGradient(0,h*.83,0,h);ground.addColorStop(0,'rgba(17,46,61,.15)');ground.addColorStop(1,'#07121d');ctx.fillStyle=ground;ctx.fillRect(0,h*.83,w,h*.17)
      for(let i=0;i<54;i++){const x=((i*73)%97)/100*w,y=h*(.91+(i*17%9)/100);ctx.fillStyle=i%8===0?'#336c78':i%3===0?'#1f3543':'#172b38';ctx.beginPath();ctx.ellipse(x,y,4+i%4,2+i%3,0,0,Math.PI*2);ctx.fill()}
      // mineral arch, reef stones and bioluminescent foliage
      ctx.save();ctx.translate(w*.71,h*.93);ctx.rotate(-.15);ctx.strokeStyle='#173846';ctx.lineWidth=25*w/900;ctx.shadowColor='#13b8e5';ctx.shadowBlur=13;ctx.beginPath();ctx.arc(0,0,h*.28,Math.PI*1.05,Math.PI*1.98);ctx.stroke();ctx.strokeStyle='rgba(92,190,200,.34)';ctx.lineWidth=2;ctx.stroke();ctx.restore()
      for(let i=0;i<18;i++){const x=w*(.06+(i*17%90)/100),y=h*(.88+(i*7%9)/100),r=(8+i%6)*w/900;ctx.fillStyle=i%3===0?'#27475a':'#102d3b';ctx.beginPath();ctx.ellipse(x,y,r,r*.48,0,0,Math.PI*2);ctx.fill()}
      const colors=['#3ca59d','#ec618f','#59bdb0','#a355c5','#83d096','#b44b88']
      for(let i=0;i<6;i++)plant(ctx,w*(.08+i*.17),h*.95,time,colors[i],i*1.4)
      for(let i=0;i<12;i++){const x=w*(.06+(i*31%88)/100),y=h*(.83+(i*11%12)/100);ctx.fillStyle=i%2?'rgba(255,79,201,.6)':'rgba(49,240,238,.6)';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x,y,1.5*w/900,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0
      }
      // central containment relic
      ctx.save();ctx.translate(w*.5,h*.91);ctx.shadowColor='#00e7ec';ctx.shadowBlur=18;ctx.fillStyle='#152d3b';ctx.fillRect(-w*.07,-h*.08,w*.14,h*.07);ctx.strokeStyle='#4be6f2';ctx.lineWidth=2;ctx.strokeRect(-w*.065,-h*.073,w*.13,h*.055);ctx.fillStyle='#00dceb';ctx.fillRect(-w*.027,-h*.064,w*.054,h*.03);ctx.restore()
      for(const b of bubbles.current){b.y-=b.speed*dt;if(b.y<-.02){b.y=1.02;b.x=.05+Math.random()*.9}const x=(b.x+Math.sin(time*1.2+b.phase)*.006)*w,y=b.y*h;ctx.strokeStyle='rgba(147,243,255,.28)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,b.size*(w/700),0,Math.PI*2);ctx.stroke()}
      stepFish(fish.current,food.current,attraction.current,pointer.current,dt,time)
      for(const pellet of food.current){ctx.shadowColor='#ffca78';ctx.shadowBlur=9;ctx.fillStyle='#f4b875';ctx.beginPath();ctx.arc(pellet.x*w,pellet.y*h,2.4*w/700,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0
      for(const f of [...fish.current].sort((a,b)=>a.depth-b.depth))drawFish(ctx,f,time,w,h)
      for(let i=ripples.current.length-1;i>=0;i--){const r=ripples.current[i];r.radius+=dt*.25;r.alpha-=dt*.65;if(r.alpha<=0){ripples.current.splice(i,1);continue}ctx.strokeStyle=`rgba(161,249,255,${r.alpha})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(r.x*w,r.y*h,r.radius*w,r.radius*h*.4,0,0,Math.PI*2);ctx.stroke()}
      const edge=ctx.createLinearGradient(0,0,w,0);edge.addColorStop(0,'rgba(0,7,18,.75)');edge.addColorStop(.08,'rgba(0,7,18,0)');edge.addColorStop(.92,'rgba(0,7,18,0)');edge.addColorStop(1,'rgba(0,7,18,.75)');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h)
    }
    frame=requestAnimationFrame(loop)
    return()=>{cancelAnimationFrame(frame);observer.disconnect()}
  },[])

  const locate=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
  return <div className="aquarium" aria-label="Interactive aquarium with six swimming fish">
    <div className="tank-top"><span>NEONABYSS <b>△</b> BIOSPHERE 09</span><span>◉ LIVE ECOSYSTEM</span></div>
    <div className="tank-side left"><i/><i/><i/><i/></div><div className="tank-side right"><i/><i/><i/><i/></div>
    <div className="tank-glass">
      <canvas ref={canvasRef} className="fish-canvas" onPointerMove={e=>{pointer.current=locate(e)}} onPointerLeave={()=>{pointer.current=null}} onPointerDown={e=>{const p=locate(e);attraction.current={...p,ttl:3};ripples.current.push({...p,radius:.02,alpha:.8})}} aria-label="Tap the water to attract the fish" />
      <WaterMotion />
      <div className="glass-reflection"/><div className="water-label">BIOSPHERE ONLINE <span>●</span></div><div className="depth-markings">20<br/>40<br/>60</div>
    </div>
    <div className="tank-base"><div className="base-vent"/><div className="base-core"/><div className="base-readout"><small>CORE TEMP</small><strong>24.6°C</strong></div><div className="base-warning">⚠ BIOLOGICAL LIFEFORM<br/>DETECTED / 06</div><div className="base-vent"/></div>
    <div className="tank-foot left"/><div className="tank-foot right"/>
  </div>
})

export default Aquarium
