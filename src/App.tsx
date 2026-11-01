import { useEffect, useRef, useState } from 'react'
import Aquarium, { type AquariumHandle } from './scene/Aquarium'
import CityCanvas, { type DayPhase, type Weather } from './scene/CityCanvas'
import { SpecialMotion } from './scene/RemotionEffects'

const weatherOptions: { id: Weather; label: string; symbol: string }[] = [
  { id: 'rain', label: 'NIGHT RAIN', symbol: '↘' },
  { id: 'fog', label: 'NEON FOG', symbol: '≋' },
  { id: 'dust', label: 'DUST STORM', symbol: '◌' },
  { id: 'clear', label: 'CLEAR NIGHT', symbol: '✧' }
]
const dayOptions: { id: DayPhase; label: string }[] = [
  { id: 'night', label: 'NIGHT CITY' },
  { id: 'blue', label: 'BLUE HOUR' },
  { id: 'sunset', label: 'SUNSET' }
]

function App() {
  const [weather, setWeather] = useState<Weather>('rain')
  const [dayPhase, setDayPhase] = useState<DayPhase>('night')
  const [special, setSpecial] = useState(false)
  const [specialStage, setSpecialStage] = useState(0)
  const [panel, setPanel] = useState(false)
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
  return <main className={`world weather-${weather} phase-${dayPhase} ${specialStage >= 2 ? 'special' : ''} ${specialStage >= 3 ? 'stage-core' : ''} ${specialStage === 1 ? 'stage-scan' : ''}`} onPointerMove={motion}>
    <CityCanvas weather={weather} dayPhase={dayPhase} special={specialStage >= 4} pointer={pointer.current} />
    <div className="window-vignette" aria-hidden="true"/><div className="window-streaks" aria-hidden="true"/>
    <div className="scanline" aria-hidden="true"/>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><span>△</span><i/></div><div><span className="eyebrow">DISTRICT 09 / SKY RESIDENCE</span><h1>NEON<span>ABYSS</span><sup>2077</sup></h1><p>A LIVING ECOSYSTEM AT THE EDGE OF TOMORROW</p></div></div>
      <div className="top-status"><span className="live-dot"/> BIOSPHERE ONLINE <em>／</em> NEURAL LINK CONNECTED <div className="top-time">{clock.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div></div>
    </header>

    <div className="scene-side left-side" aria-hidden="true"><span>01 / OBSERVATION DECK</span><div className="side-line"/><small>生命在深渊中发光</small></div>
    <div className="scene-side right-side" aria-hidden="true"><span>NIGHT CITY / SECTOR 09</span><div className="side-line"/><small>ENVIRONMENT / {weather.toUpperCase()}</small></div>

    <section className="centerpiece" aria-label="NeonAbyss interactive aquarium">
      <div className="tank-hud hud-left"><span className="hud-line"/><small>SYS // 001</small><strong>AQUARIUM<br/>SYSTEM</strong><span className="hud-data">BIOLOGICAL LIFEFORM<br/>DETECTED <b>06</b></span></div>
      <Aquarium ref={tank}/>
      <div className="tank-hud hud-right"><small>O₂ SATURATION</small><strong>{oxygen}<sub>%</sub></strong><span className="oxygen-bars">▂ ▃ ▅ ▆ ▄ ▇ ▅ ▄ ▆ ▇ ▃</span><small>WATER QUALITY <b>OPTIMAL</b></small></div>
    </section>

    <div className="bottom-shade" aria-hidden="true"/>
    <footer className="control-deck">
      <div className="deck-intro"><span className="eyebrow">INTERACTIVE BIOSPHERE / V.09</span><h2>Keep the quiet alive<span>.</span></h2><p>Tap the water. Feed the life within.</p></div>
      <div className="control-groups">
        <button className={`feed-button ${feedPulse?'feeding':''}`} onClick={feed} aria-label="Feed the fish"><span className="feed-icon">✣</span><span><small>INTERACT / 01</small><b>FEED FISH</b></span><span className="button-arrow">↗</span></button>
        <div className="control-stack"><span className="control-caption">ATMOSPHERE <i>／ 02</i></span><div className="segmented" role="group" aria-label="Weather"><span className="control-leading">{weatherOptions.find(w=>w.id===weather)?.symbol}</span><select value={weather} onChange={e=>setWeather(e.target.value as Weather)} aria-label="Select weather">{weatherOptions.map(w=><option value={w.id} key={w.id}>{w.label}</option>)}</select><span className="chevron">⌄</span></div></div>
        <div className="control-stack"><span className="control-caption">TIME CYCLE <i>／ 03</i></span><div className="segmented"><span className="control-leading">◷</span><select value={dayPhase} onChange={e=>setDayPhase(e.target.value as DayPhase)} aria-label="Select time of day">{dayOptions.map(d=><option value={d.id} key={d.id}>{d.label}</option>)}</select><span className="chevron">⌄</span></div></div>
        <button className="system-button" onClick={()=>setPanel(v=>!v)} aria-expanded={panel} aria-controls="systems-panel" aria-label="Toggle aquarium systems"><span>⌘</span><small>SYSTEMS</small></button>
        <button className="secret-button" onClick={toggleSpecial} aria-pressed={special} aria-label="Toggle special mode" title="SPECIAL MODE"><span>✧</span></button>
      </div>
    </footer>
    <aside id="systems-panel" className={`systems-panel ${panel?'open':''}`} aria-hidden={!panel}>
      <div className="panel-heading"><div><span className="eyebrow">DIAGNOSTICS / SIMULATED</span><h3>BIOSPHERE STATUS</h3></div><button onClick={()=>setPanel(false)} aria-label="Close systems panel">×</button></div>
      <div className="panel-line"><span>WATER TEMPERATURE</span><b>{temp}°C</b></div>
      <div className="panel-line"><span>OXYGEN LEVEL</span><b>{oxygen}%</b></div>
      <div className="panel-line"><span>PH LEVEL</span><b>{ph}</b></div>
      <div className="panel-line"><span>WATER QUALITY</span><b>OPTIMAL</b></div>
      <div className="panel-line"><span>FISH COUNT</span><b>06</b></div>
      <div className="panel-status"><span className="live-dot"/> ECOSYSTEM STATUS: STABLE</div>
      <p>Decorative simulation · No real sensors connected</p>
    </aside>
    {special && <div aria-hidden="true"><SpecialMotion /></div>}
  </main>
}

export default App
