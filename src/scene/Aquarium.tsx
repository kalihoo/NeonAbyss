import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { addFood, createFish, stepFish, type Attraction, type Food, type Vec } from './fishAI'
import reefPlate from '../assets/reef-interior.jpg'
import { WaterMotion } from './RemotionEffects'
import { drawFish, loadFishSprites, type FishSprites } from './FishVisuals'
import { drawFood } from './FoodVisuals'
import { loadSprite } from './sprites'
import type { UploadedFish } from './customFishStorage'

export type AquariumHandle = { feed: () => void }
type AquariumProps = {
  customFish: UploadedFish[]
  uploadStatus: string
  onUploadFiles: (files: File[]) => void
  onRemoveCustomFish: (id: string) => void
}
type Ripple = Vec & { radius: number; alpha: number }
type Bubble = Vec & { size: number; speed: number; phase: number }

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

const Aquarium=forwardRef<AquariumHandle, AquariumProps>(function Aquarium({customFish,uploadStatus,onUploadFiles,onRemoveCustomFish},ref){
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const fish=useRef(createFish())
  const sprites=useRef<FishSprites>({})
  const customSpriteLoads=useRef(new Map<string,{url:string;cancel:()=>void}>())
  const [libraryOpen,setLibraryOpen]=useState(false)
  const [previewUrls,setPreviewUrls]=useState<Record<string,string>>({})
  const food=useRef<Food[]>([])
  const glitchPulse=useRef(0)
  const effectClock=useRef(0)
  const pointer=useRef<Vec|null>(null)
  const attraction=useRef<Attraction|null>(null)
  const ripples=useRef<Ripple[]>([])
  const bubbles=useRef<Bubble[]>(Array.from({length:30},(_,i)=>({x:.08+(i*37%87)/100,y:(i*31%100)/100,size:1+i%3,speed:.025+(i%5)*.009,phase:i*1.3})))
  useImperativeHandle(ref,()=>({feed:()=>{addFood(food.current);glitchPulse.current=1.25;ripples.current.push({x:.5,y:.06,radius:.02,alpha:.7})}}),[])

  useEffect(()=>{
    const wanted=new Set(customFish.map(item=>item.id))
    fish.current=fish.current.filter(f=>!f.kind.startsWith('custom:')||wanted.has(f.kind.slice(7)))
    for(const [id,load] of customSpriteLoads.current){
      if(wanted.has(id))continue
      load.cancel();URL.revokeObjectURL(load.url);customSpriteLoads.current.delete(id)
      delete sprites.current[`custom:${id}`]
    }
    customFish.forEach((item,index)=>{
      const kind=`custom:${item.id}` as const
      if(!fish.current.some(f=>f.kind===kind))fish.current.push({id:100+index,kind,x:.18+Math.random()*.64,y:.22+Math.random()*.48,vx:index%2?-.025:.025,vy:(Math.random()-.5)*.018,angle:index%2?Math.PI:0,size:.58+(index%3)*.08,depth:.42+(index%4)*.13,phase:index*1.53,wander:{x:.5,y:.5},wanderTimer:0})
      if(customSpriteLoads.current.has(item.id))return
      const url=URL.createObjectURL(item.blob)
      const cancel=loadSprite(url,sprite=>{sprites.current[kind]=sprite},true)
      customSpriteLoads.current.set(item.id,{url,cancel})
    })
  },[customFish])

  useEffect(()=>()=>{
    for(const load of customSpriteLoads.current.values()){load.cancel();URL.revokeObjectURL(load.url)}
    customSpriteLoads.current.clear()
  },[])

  useEffect(()=>{
    const urls:Record<string,string>={}
    for(const item of customFish)urls[item.id]=URL.createObjectURL(item.blob)
    setPreviewUrls(urls)
    return()=>Object.values(urls).forEach(URL.revokeObjectURL)
  },[customFish])

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const ctx=canvas.getContext('2d');if(!ctx)return
    const reef=new Image();reef.src=reefPlate
    const disposeSprites=loadFishSprites(sprites.current)
    let frame=0,last=0,time=0
    const media=window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced=media.matches
    const updateMotion=()=>{reduced=media.matches}
    media.addEventListener('change',updateMotion)
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
      glitchPulse.current=Math.max(0,glitchPulse.current-dt)
      for(const pellet of food.current)drawFood(ctx,pellet,time,w,h,reduced,w/canvas.clientWidth)
      for(const f of [...fish.current].sort((a,b)=>a.depth-b.depth))drawFish(ctx,f,time,w,h,sprites.current,reduced,glitchPulse.current,effectClock.current)
      for(let i=ripples.current.length-1;i>=0;i--){const r=ripples.current[i];r.radius+=dt*.25;r.alpha-=dt*.65;if(r.alpha<=0){ripples.current.splice(i,1);continue}ctx.strokeStyle=`rgba(161,249,255,${r.alpha})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(r.x*w,r.y*h,r.radius*w,r.radius*h*.4,0,0,Math.PI*2);ctx.stroke()}
      const edge=ctx.createLinearGradient(0,0,w,0);edge.addColorStop(0,'rgba(0,7,18,.75)');edge.addColorStop(.08,'rgba(0,7,18,0)');edge.addColorStop(.92,'rgba(0,7,18,0)');edge.addColorStop(1,'rgba(0,7,18,.75)');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h)
    }
    frame=requestAnimationFrame(loop)
    return()=>{cancelAnimationFrame(frame);observer.disconnect();media.removeEventListener('change',updateMotion);disposeSprites()}
  },[])

  const locate=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
  return <div className="aquarium" aria-label={`交互式鱼缸，当前共有 ${9+customFish.length} 条鱼`}>
    <div className="tank-top"><span>NEONABYSS <b>△</b> BIOSPHERE {String(9+customFish.length).padStart(2,'0')}</span><span>◉ LIVE ECOSYSTEM</span></div>
    <div className="tank-side left"><i/><i/><i/><i/></div><div className="tank-side right"><i/><i/><i/><i/></div>
    <div className="tank-glass">
      <canvas ref={canvasRef} className="fish-canvas" onPointerMove={e=>{pointer.current=locate(e)}} onPointerLeave={()=>{pointer.current=null}} onPointerDown={e=>{const p=locate(e);attraction.current={...p,ttl:3};ripples.current.push({...p,radius:.02,alpha:.8})}} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();attraction.current={x:.5,y:.4,ttl:3};ripples.current.push({x:.5,y:.4,radius:.02,alpha:.8})}}} aria-label="点击水面或按回车键吸引鱼群" />
      <WaterMotion clockRef={effectClock}/>
      <div className="glass-reflection"/><div className="water-label">BIOSPHERE ONLINE <span>●</span></div><div className="depth-markings">20<br/>40<br/>60</div>
      <div className="custom-fish-tools">
        <label className="fish-upload-button" title="仅保存到当前浏览器的本站；支持 PNG、JPG、WebP，最多 6 条鱼">
          <input className="fish-file-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e=>{const files=Array.from(e.currentTarget.files??[]);if(files.length)onUploadFiles(files);e.currentTarget.value=''}} aria-label="上传鱼的图片到鱼缸" />
          <span>＋</span> 上传鱼图
        </label>
        {customFish.length>0&&<button className="fish-library-toggle" onClick={()=>setLibraryOpen(v=>!v)} aria-expanded={libraryOpen} aria-label={`管理已上传的 ${customFish.length} 条鱼图`}>鱼图 / {customFish.length}</button>}
      </div>
      {libraryOpen&&<section className="fish-library-panel" aria-label="管理自定义鱼图">
        <div className="fish-library-heading"><strong>自定义鱼群 <span>{String(9+customFish.length).padStart(2,'0')}</span></strong><button onClick={()=>setLibraryOpen(false)} aria-label="关闭自定义鱼列表">×</button></div>
        <p>图片仅保存在当前浏览器的本站；透明底横图效果更佳。</p>
        <div className="fish-library-list">{customFish.map(item=><div className="fish-library-item" key={item.id}>
          {previewUrls[item.id]?<img src={previewUrls[item.id]} alt=""/>:<span className="fish-library-placeholder">◇</span>}
          <span title={item.name}>{item.name}</span>
          <button onClick={()=>onRemoveCustomFish(item.id)} aria-label={`从鱼缸移除 ${item.name}`}>×</button>
        </div>)}</div>
        <div className="fish-upload-status" role="status" aria-live="polite">{uploadStatus||'支持 PNG、JPG、WebP；单张不超过 8 MB'}</div>
      </section>}
      {uploadStatus&&!libraryOpen&&<div className="fish-upload-toast" role="status" aria-live="polite">{uploadStatus}</div>}
    </div>
    <div className="tank-base"><div className="base-vent"/><div className="base-core"/><div className="base-readout"><small>CORE TEMP</small><strong>24.6°C</strong></div><div className="base-warning">⚠ BIOLOGICAL LIFEFORM<br/>DETECTED / {String(9+customFish.length).padStart(2,'0')}</div><div className="base-vent"/></div>
    <div className="tank-foot left"/><div className="tank-foot right"/>
  </div>
})

export default Aquarium
