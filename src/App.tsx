import { useEffect, useRef, useState } from 'react'
import Aquarium, { type AquariumHandle } from './scene/Aquarium'
import CityCanvas, { type DayPhase, type Weather } from './scene/CityCanvas'
import { SpecialMotion } from './scene/RemotionEffects'
import { deleteUploadedFish, getUploadedFish, saveUploadedFish, type UploadedFish } from './scene/customFishStorage'

const maxCustomFish = 6
const maxFishImageBytes = 8 * 1024 * 1024
const maxFishImagePixels = 6_000_000

function readImageDimensions(file: File) {
  return new Promise<{width:number;height:number}>((resolve,reject)=>{
    const url=URL.createObjectURL(file)
    const image=new Image()
    image.onload=()=>{URL.revokeObjectURL(url);resolve({width:image.naturalWidth,height:image.naturalHeight})}
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('图片无法解码，请换一张图片'))}
    image.src=url
  })
}

const weatherOptions: { id: Weather; label: string; symbol: string }[] = [
  { id: 'rain', label: '夜雨', symbol: '↘' },
  { id: 'fog', label: '霓虹迷雾', symbol: '≋' },
  { id: 'dust', label: '沙尘暴', symbol: '◌' },
  { id: 'clear', label: '晴朗夜空', symbol: '✧' }
]
const dayOptions: { id: DayPhase; label: string }[] = [
  { id: 'night', label: '夜之城' },
  { id: 'blue', label: '蓝调时刻' },
  { id: 'sunset', label: '落日余晖' }
]

function App() {
  const [weather, setWeather] = useState<Weather>('rain')
  const [dayPhase, setDayPhase] = useState<DayPhase>('night')
  const [special, setSpecial] = useState(false)
  const [specialStage, setSpecialStage] = useState(0)
  const [panel, setPanel] = useState(false)
  const [customFish, setCustomFish] = useState<UploadedFish[]>([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [feedPulse, setFeedPulse] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [tick, setTick] = useState(0)
  const pointer = useRef({ x: 0, y: 0 })
  const tank = useRef<AquariumHandle>(null)
  const feedTimer = useRef<number | undefined>(undefined)
  const stageTimers = useRef<number[]>([])

  useEffect(() => {
    const timer = window.setInterval(() => { setClock(new Date()); setTick(v => v + 1) }, 1000)
    return () => { clearInterval(timer); clearTimeout(feedTimer.current); stageTimers.current.forEach(clearTimeout) }
  }, [])
  useEffect(() => {
    let active=true
    getUploadedFish().then(records=>{
      if(!active)return
      setCustomFish(records.slice(0,maxCustomFish))
      if(records.length>0)setUploadStatus(`已从本地恢复 ${Math.min(records.length,maxCustomFish)} 条自定义鱼`)
    }).catch(error=>{if(active)setUploadStatus(error instanceof Error?error.message:'无法读取本地鱼图')})
    return()=>{active=false}
  },[])
  const uploadFishImages = async (files:File[]) => {
    const added:UploadedFish[]=[]
    const rejected:string[]=[]
    let remaining=maxCustomFish-customFish.length
    for(const file of files){
      if(remaining<=0){rejected.push(`最多可放入 ${maxCustomFish} 条自定义鱼`);break}
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)){rejected.push(`${file.name}：只支持 PNG、JPG 或 WebP`);continue}
      if(file.size>maxFishImageBytes){rejected.push(`${file.name}：图片不能超过 8 MB`);continue}
      try{
        const {width,height}=await readImageDimensions(file)
        if(width<64||height<32||width>4096||height>4096||width*height>maxFishImagePixels){rejected.push(`${file.name}：图片尺寸需在 64×32 至 4096×4096 之间，且不超过 600 万像素`);continue}
        const record:UploadedFish={id:typeof crypto.randomUUID==='function'?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`,name:file.name.slice(0,80),blob:file,createdAt:Date.now()+added.length}
        await saveUploadedFish(record)
        added.push(record);remaining-=1
      }catch(error){rejected.push(error instanceof Error?error.message:'保存图片失败，可能是浏览器存储空间不足')}
    }
    if(added.length)setCustomFish(current=>[...current,...added].slice(0,maxCustomFish))
    setUploadStatus(added.length&&rejected.length?`已加入 ${added.length} 条；${rejected[0]}`:added.length?`已加入鱼缸 ${added.length} 条自定义鱼`:rejected[0]||'没有添加鱼图')
  }
  const removeCustomFish = async (id:string) => {
    try{
      await deleteUploadedFish(id)
      setCustomFish(current=>current.filter(item=>item.id!==id))
      setUploadStatus('已从鱼缸和本地存储中移除鱼图')
    }catch(error){setUploadStatus(error instanceof Error?error.message:'移除鱼图失败')}
  }
  const feed = () => {
    tank.current?.feed()
    setFeedPulse(true)
    clearTimeout(feedTimer.current)
    feedTimer.current = window.setTimeout(() => setFeedPulse(false), 850)
  }
  const motion = (e: React.PointerEvent<HTMLElement>) => {
    pointer.current.x = (e.clientX / window.innerWidth - .5) * 2
    pointer.current.y = (e.clientY / window.innerHeight - .5) * 2
  }
  const toggleSpecial = () => {
    stageTimers.current.forEach(clearTimeout)
    stageTimers.current = []
    if (special) { setSpecial(false); setSpecialStage(0); return }
    setSpecial(true); setSpecialStage(1)
    ;[2, 3, 4].forEach((stage, i) => stageTimers.current.push(window.setTimeout(() => setSpecialStage(stage), [650, 1400, 2200][i])))
  }
  const temp = (24.6 + Math.sin(tick * .09) * .14).toFixed(1)
  const oxygen = (98 + Math.sin(tick * .21) * 1.3).toFixed(0)
  const ph = (7.2 + Math.sin(tick * .13) * .04).toFixed(2)
  const fishCount = String(9 + customFish.length).padStart(2,'0')
  return <main className={`world weather-${weather} phase-${dayPhase} ${specialStage >= 2 ? 'special' : ''} ${specialStage >= 3 ? 'stage-core' : ''} ${specialStage === 1 ? 'stage-scan' : ''}`} onPointerMove={motion}>
    <CityCanvas weather={weather} dayPhase={dayPhase} special={specialStage >= 4} pointer={pointer.current} />
    <div className="window-vignette" aria-hidden="true"/><div className="window-streaks" aria-hidden="true"/>
    <div className="scanline" aria-hidden="true"/>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><span>△</span><i/></div><div><span className="eyebrow">DISTRICT 09 / SKY RESIDENCE</span><h1>NEON<span>ABYSS</span><sup>2077</sup></h1><p>A LIVING ECOSYSTEM AT THE EDGE OF TOMORROW</p></div></div>
      <div className="top-status"><span className="live-dot"/> BIOSPHERE ONLINE <em>／</em> NEURAL LINK CONNECTED <div className="top-time">{clock.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div></div>
    </header>

    <div className="scene-side left-side" aria-hidden="true"><span>01 / OBSERVATION DECK</span><div className="side-line"/></div>
    <div className="scene-side right-side" aria-hidden="true"><span>NIGHT CITY / SECTOR 09</span><div className="side-line"/><small>ENVIRONMENT / {weather.toUpperCase()}</small></div>

    <section className="centerpiece" aria-label="NeonAbyss interactive aquarium">
      <div className="tank-hud hud-left"><span className="hud-line"/><small>SYS // 001</small><strong>AQUARIUM<br/>SYSTEM</strong><span className="hud-data">BIOLOGICAL LIFEFORM<br/>DETECTED <b>{fishCount}</b></span></div>
      <Aquarium ref={tank} customFish={customFish} uploadStatus={uploadStatus} onUploadFiles={uploadFishImages} onRemoveCustomFish={removeCustomFish}/>
      <div className="tank-hud hud-right"><small>O₂ SATURATION</small><strong>{oxygen}<sub>%</sub></strong><span className="oxygen-bars">▂ ▃ ▅ ▆ ▄ ▇ ▅ ▄ ▆ ▇ ▃</span><small>WATER QUALITY <b>优良</b></small></div>
    </section>

    <div className="bottom-shade" aria-hidden="true"/>
    <footer className="control-deck">
      <div className="deck-intro"><span className="eyebrow">INTERACTIVE BIOSPHERE / V.09</span><h2>Keep the quiet alive<span>.</span></h2><p>Tap the water. Feed the life within.</p></div>
      <div className="control-groups">
        <button className={`feed-button ${feedPulse?'feeding':''}`} onClick={feed} aria-label="投喂鱼群" title="投放芯片、显卡与赛博齿轮"><span className="feed-icon">✣</span><span><small>互动 / 01</small><b>投喂鱼群</b></span><span className="button-arrow">↗</span></button>
        <div className="control-stack"><span className="control-caption">天气 <i>／ 02</i></span><div className="segmented" role="group" aria-label="天气"><span className="control-leading">{weatherOptions.find(w=>w.id===weather)?.symbol}</span><select value={weather} onChange={e=>setWeather(e.target.value as Weather)} aria-label="选择天气">{weatherOptions.map(w=><option value={w.id} key={w.id}>{w.label}</option>)}</select><span className="chevron">⌄</span></div></div>
        <div className="control-stack"><span className="control-caption">时段 <i>／ 03</i></span><div className="segmented"><span className="control-leading">◷</span><select value={dayPhase} onChange={e=>setDayPhase(e.target.value as DayPhase)} aria-label="选择时段">{dayOptions.map(d=><option value={d.id} key={d.id}>{d.label}</option>)}</select><span className="chevron">⌄</span></div></div>
        <button className="system-button" onClick={()=>setPanel(v=>!v)} aria-expanded={panel} aria-controls="systems-panel" aria-label="系统状态"><span>⌘</span><small>系统状态</small></button>
        <button className="secret-button" onClick={toggleSpecial} aria-pressed={special} aria-label="特殊模式" title="开启或关闭特殊模式"><span>✧</span><small>特殊模式</small></button>
      </div>
    </footer>
    <aside id="systems-panel" className={`systems-panel ${panel?'open':''}`} aria-hidden={!panel}>
      <div className="panel-heading"><div><span className="eyebrow">生态诊断 / 模拟读数</span><h3>生态系统状态</h3></div><button onClick={()=>setPanel(false)} aria-label="关闭系统面板">×</button></div>
      <div className="panel-line"><span>水温</span><b>{temp}°C</b></div>
      <div className="panel-line"><span>含氧量</span><b>{oxygen}%</b></div>
      <div className="panel-line"><span>酸碱度 pH</span><b>{ph}</b></div>
      <div className="panel-line"><span>水质</span><b>优良</b></div>
      <div className="panel-line"><span>鱼类数量</span><b>{fishCount}</b></div>
      <div className="panel-status"><span className="live-dot"/> 生态系统：稳定</div>
      <p>模拟生态数据 · 未连接真实传感器</p>
    </aside>
    {special && <div aria-hidden="true"><SpecialMotion /></div>}
  </main>
}

export default App
