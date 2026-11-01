import { Player } from '@remotion/player'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const}

function WaterLightLoop(){
  const frame=useCurrentFrame()
  const drift=interpolate(frame,[0,180,360],[-12,12,-12],clamp)
  const shimmer=interpolate(frame,[0,90,180,270,360],[.18,.3,.16,.27,.18],clamp)
  return <AbsoluteFill style={{overflow:'hidden',pointerEvents:'none',mixBlendMode:'screen'}}>
    <AbsoluteFill style={{opacity:shimmer,translate:`${drift}% 0`,background:'linear-gradient(108deg,transparent 5%,rgba(166,247,255,.28) 16%,transparent 24%,transparent 41%,rgba(150,179,255,.21) 54%,transparent 60%,transparent 78%,rgba(255,96,241,.12) 83%,transparent 89%)'}}/>
    <AbsoluteFill style={{opacity:interpolate(frame,[0,90,180,270,360],[.13,.23,.1,.19,.13],clamp),background:'radial-gradient(ellipse 60% 15% at 50% 0,rgba(117,246,255,.75),transparent 75%)'}}/>
  </AbsoluteFill>
}

export function WaterMotion(){
  return <Player component={WaterLightLoop} durationInFrames={360} compositionWidth={1000} compositionHeight={500} fps={30} autoPlay loop controls={false} clickToPlay={false} initiallyMuted style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1}} />
}

function SpecialComposition(){
  const frame=useCurrentFrame()
  const lineY=interpolate(frame,[0,32],[-30,120],{...clamp,easing:Easing.bezier(.2,.8,.25,1)})
  const lineOpacity=interpolate(frame,[0,8,31,44],[0,.75,.55,0],clamp)
  const titleOpacity=interpolate(frame,[25,48,112,143],[0,1,1,0],clamp)
  const glowOpacity=interpolate(frame,[0,28,52,95,155],[0,.08,.31,.13,0],clamp)
  const ringScale=interpolate(frame,[32,105],[.35,2.4],{...clamp,easing:Easing.bezier(.1,.7,.2,1)})
  const ringOpacity=interpolate(frame,[28,42,100],[0,.8,0],clamp)
  return <AbsoluteFill style={{overflow:'hidden',pointerEvents:'none',backgroundColor:'transparent'}}>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at center,rgba(255,31,169,.35),rgba(52,0,76,.1) 55%,transparent 75%)',opacity:glowOpacity}}/>
    <div style={{position:'absolute',left:0,right:0,top:`${lineY}%`,height:5,background:'linear-gradient(90deg,transparent,#ff31d9 35%,#d9fcff 50%,#ff31d9 65%,transparent)',boxShadow:'0 0 32px 8px #ff2bd6',opacity:lineOpacity}}/>
    <div style={{position:'absolute',width:460,height:460,left:'50%',top:'50%',marginLeft:-230,marginTop:-230,border:'2px solid #ff4ade',borderRadius:'50%',boxShadow:'0 0 26px #ff2bd6,inset 0 0 26px #ff2bd6',scale:ringScale,opacity:ringOpacity}}/>
    <div style={{position:'absolute',top:'42%',width:'100%',textAlign:'center',color:'#ffb5ec',fontFamily:'monospace',fontSize:16,letterSpacing:9,textShadow:'0 0 12px #ff2bd6',opacity:titleOpacity}}>NEONABYSS / OVERDRIVE</div>
    <div style={{position:'absolute',top:'48%',width:'100%',textAlign:'center',color:'#f7f4fa',fontFamily:'sans-serif',fontSize:74,fontWeight:800,letterSpacing:4,textShadow:'0 0 25px #ff2bd6',opacity:titleOpacity,scale:interpolate(frame,[35,70],[.84,1],clamp)}}>THE DEEP IS ALIVE</div>
    <div style={{position:'absolute',left:'18%',right:'18%',top:'61%',height:1,background:'#ff2bd6',boxShadow:'0 0 20px #ff2bd6',opacity:titleOpacity}}/>
  </AbsoluteFill>
}

export function SpecialMotion(){
  return <Player component={SpecialComposition} durationInFrames={160} compositionWidth={1440} compositionHeight={900} fps={30} autoPlay controls={false} clickToPlay={false} initiallyMuted style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:9}} />
}
