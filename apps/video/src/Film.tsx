import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Architecture} from './Architecture';
import {XProof, XWithdrawal, XTerminal} from './XEvidence';
import {subtitleCues, timeline, type Panel, type Rect, type Scene, type VideoProps} from './model';
const theme={bg:'#101815',panel:'#17201b',line:'#344038',ink:'#edf0e9',muted:'#a6b4aa',accent:'#b6df7c'};
const mono='"SFMono-Regular", Consolas, "Liberation Mono", monospace';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const p=clamp(n);return p*p*(3-2*p);};
function camera(panel:Panel,t:number):Rect {
  const keys=panel.camera;
  const left=[...keys].reverse().find(k=>k.at<=t)??keys[0]!;
  const right=keys.find(k=>k.at>t)??left;
  const p=right===left?0:ease((t-left.at)/(right.at-left.at));
  return left.rect.map((n,i)=>n+(right.rect[i]!-n)*p) as Rect;
}
const FootagePanel:React.FC<{panel:Panel;t:number}>=({panel,t})=>{
  const [bx,by,bw,bh]=panel.box, w=bw*1800-16, h=bh*716-16;
  const [x,y,rw,rh]=camera(panel,t), scale=w/rw;
  const crop=panel.crop??[0,0,1920,1080];
  const [cx,cy,cw,ch]=crop;
  return <div style={{position:'absolute',left:bx*1800+8,top:by*716+8,width:w,height:h,borderRadius:18,overflow:'hidden',border:`1px solid ${theme.line}`,background:theme.panel,boxShadow:'0 18px 44px #0005'}}>
    <div style={{position:'absolute',inset:'44px 0 0',overflow:'hidden'}}>
      <div style={{position:'absolute',left:w/2+(cx-x-rw/2)*scale,top:(h-44)/2+(cy-y-rh/2)*scale,width:cw*scale,height:ch*scale,overflow:'hidden'}}>
        <Img src={staticFile(panel.asset)} style={{position:'absolute',maxWidth:'none',width:1920*scale,height:1080*scale,left:-cx*scale,top:-cy*scale}}/>
      </div>
    </div>
    <div style={{position:'absolute',top:0,left:0,right:0,height:44,padding:'10px 20px',background:'#1d2821',fontSize:19,fontWeight:600,letterSpacing:1,color:theme.muted,whiteSpace:'nowrap'}}>{panel.label}</div>
  </div>;
};
const Footage:React.FC<{scene:Scene;seconds:number}>=({scene,seconds})=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  const time=(f/fps)*scene.seconds/seconds;
  const shot=[...scene.shots].reverse().find(s=>s.at<=time)??scene.shots[0]!;
  return <div style={{position:'absolute',left:60,top:134,width:1800,height:716}}>{shot.panels.map((p,i)=><FootagePanel key={`${shot.at}-${i}`} panel={p} t={time-shot.at}/>)}</div>;
};
const Line:React.FC<{row:VideoProps['terminal'][number];size?:number}>=({row,size=30})=>{
  const green=/PASS|SIGNED/.test(row.text), red=/REJECT/.test(row.text);
  return <div style={{display:'flex',gap:20,fontFamily:mono,fontSize:size,lineHeight:1.42,padding:'6px 0',color:red?'#ff777d':green?'#69e2a8':theme.ink}}><span style={{color:'#77897c',flex:'0 0 65px'}}>{String(row.number).padStart(3,'0')} │</span><span style={{overflowWrap:'anywhere'}}>{row.text}</span></div>;
};
const Terminal:React.FC<{scene:Scene;seconds:number;rows:VideoProps['terminal']}>=({scene,seconds,rows})=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig(), t=f/fps;
  const rogue=scene.kind==='rogue';
  const attacks=rows.filter(row=>row.text.startsWith('ROGUE '));
  const summary=rows.find(row=>row.text.startsWith('PASS 7/7'));
  const find=(pattern:RegExp)=>rows.filter(row=>pattern.test(row.text));
  const finalHold=t>=seconds-(scene.cut==='judge'?3.5:3);
  let visible:typeof rows;
  let size=32;
  if (rogue) {
    const progress=clamp(t/Math.max(1,seconds-5.5));
    visible=attacks.slice(0,Math.max(1,Math.ceil(progress*7)));
    if(progress>.72) visible=[...visible,...find(/^DEAD-MAN before/)];
    if(progress>.9) visible=[...visible,...find(/^DEAD-MAN \+601/)];
    if(finalHold&&summary) visible=[...find(/^DEAD-MAN \+601/),summary];
    size=finalHold?43:27;
  } else if(t<3) {
    visible=rows.slice(0,9); size=22;
  } else if(t<seconds*.42) {
    visible=[...find(/^FIXTURES /),...find(/^SETUP local/),...find(/^POLICY SHA/),...find(/^OWNER FROZEN/)];size=31;
  } else if(t<seconds*.72) {
    visible=[...find(/^FIXTURES /),...find(/reduce-only close\s+SIGNED/),...find(/^PASS owner nonce/)]; size=36;
  } else {
    visible=[...find(/reduce-only close\s+SIGNED/),...find(/^OWNER FROZEN/),...find(/^OWNER AFTER/),...find(/^PASS owner nonce/)];size=31;
  }
  return <div style={{position:'absolute',left:90,top:152,width:1740,height:687,border:`1px solid ${theme.line}`,borderRadius:22,background:'#0c1510',overflow:'hidden',boxShadow:'0 25px 70px #0005'}}>
    <div style={{height:65,borderBottom:`1px solid ${theme.line}`,padding:'17px 28px',display:'flex',gap:14,alignItems:'center'}}>{['#ff777d','#e0b880','#69e2a8'].map(color=><div key={color} style={{width:12,height:12,borderRadius:20,background:color}}/>)}<span style={{fontFamily:mono,fontSize:23,marginLeft:20,color:theme.muted}}>counterweight / npm run demo:local / {rogue?'adversarial calls':'autonomous keeper'}</span></div>
    <div style={{padding:'22px 32px'}}>{visible.map(row=><Line row={row} size={size} key={row.number}/>)}</div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'#152219',padding:'12px 28px',fontFamily:mono,fontSize:18,color:theme.muted}}>ACTUAL SAVED TRANSCRIPT · ORIGINAL LINE NUMBERS · EDITED REVEAL, NOT COMMAND RUNTIME</div>
  </div>;
};
const EndCard:React.FC<{repoUrl:string;judge:boolean}>=({repoUrl,judge})=>{
  const f=useCurrentFrame();const entrance=ease(f/24);
  return <AbsoluteFill style={{padding:'180px 112px 230px',opacity:entrance,transform:`translateY(${(1-entrance)*18}px)`}}>
    {judge&&<div style={{color:theme.accent,fontSize:27,letterSpacing:5,marginBottom:35}}>BUILT AT NEAR HACKATHON · DEFI TRACK</div>}
    <div style={{fontSize:112,fontWeight:650,letterSpacing:-7}}>counterweight<span style={{color:theme.accent}}>.</span></div>
    <div style={{marginTop:38,fontSize:repoUrl.length>65?32:40,color:theme.accent,overflowWrap:'anywhere',maxWidth:1640}}>{repoUrl}</div>
    <div style={{fontFamily:mono,fontSize:29,marginTop:38,borderTop:`1px solid ${theme.line}`,paddingTop:30}}>npm ci &amp;&amp; npm test &amp;&amp; npm run demo:local</div>
    <div style={{fontFamily:mono,fontSize:24,marginTop:30,color:theme.muted}}>policy-v2.counterweight-samet.testnet{judge&&<><br/>policy-v3.counterweight-samet.testnet</>}</div>
    <div style={{fontSize:26,color:theme.muted,marginTop:32}}>Supervised testnet prototype · Owner observations trusted · Intents dry-only</div>
    <div style={{fontSize:23,color:theme.muted,marginTop:16}}>Experimental software, not investment advice</div>
  </AbsoluteFill>;
};
const SceneView:React.FC<{scene:Scene;seconds:number;props:VideoProps}>=({scene,seconds,props})=>{
  const f=useCurrentFrame();
  const cues=subtitleCues(scene.voiceover);
  const cue=cues[Math.min(cues.length-1,Math.floor(f/(seconds*30)*cues.length))];
  return <AbsoluteFill style={{background:theme.bg,color:theme.ink,fontFamily:'Arial, Helvetica, sans-serif'}}>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 10%, #273b2a55, transparent 70%)'}}/>
    {scene.kind==='footage'&&<Footage scene={scene} seconds={seconds}/>}
    {scene.kind==='proof'&&<XProof scene={scene} seconds={seconds}/>}
    {scene.kind==='withdrawal'&&<XWithdrawal/>}
    {scene.kind==='diagram'&&<Architecture judge={scene.cut==='judge'} seconds={seconds}/>}
    {(scene.kind==='keeper'||scene.kind==='rogue')&&(scene.cut==='x'?<XTerminal scene={scene} seconds={seconds} rows={props.terminal}/>:<Terminal scene={scene} seconds={seconds} rows={props.terminal}/>)}
    {scene.kind==='end'&&<EndCard repoUrl={props.repoUrl} judge={scene.cut==='judge'}/>}
    <div style={{position:'absolute',left:72,top:36,fontSize:23,letterSpacing:2,color:theme.accent,fontWeight:600,maxWidth:1400}}>{scene.badge}</div>
    <div style={{position:'absolute',right:74,top:36,fontSize:24,color:theme.muted}}>counterweight<span style={{color:theme.accent}}>.</span></div>
    {scene.kind!=='end'&&<div style={{position:'absolute',left:72,top:84,fontSize:24,color:theme.muted}}>{scene.id.replace('A','X · ').replace('B','JUDGE · ')} / {scene.title}</div>}
    <div style={{position:'absolute',left:0,right:0,bottom:0,height:194,background:'#0b120f',borderTop:`1px solid ${theme.line}`,display:'flex',alignItems:props.subtitles?'flex-start':'center',padding:props.subtitles?'18px 90px':'32px 90px',gap:28}}>
      <div style={{width:5,height:60,background:theme.accent,borderRadius:10}}/>
      <div style={{fontSize:props.subtitles?42:56,lineHeight:1.16,fontWeight:550,letterSpacing:-.8,maxWidth:1690,opacity:interpolate(f,[0,7],[.7,1],{extrapolateRight:'clamp'})}}>{scene.caption}</div>
    </div>
    {props.subtitles&&<div data-subtitle style={{position:'absolute',left:118,right:90,bottom:24,fontSize:33,lineHeight:1.22,color:'#fff',background:'#0b120f'}}>{cue}</div>}
    <div style={{position:'absolute',bottom:0,left:0,height:4,width:`${100*clamp(f/(seconds*30-1))}%`,background:theme.accent,opacity:.6}}/>
    {props.audio[scene.id]&&<><Audio src={staticFile(props.audio[scene.id]!.src)}/>{[0,...(scene.kind==='diagram'?[2.9,4,5.6,7.1,9,10.6,...(scene.cut==='judge'?[14,15,16.8]:[])]:scene.kind==='rogue'?[1.2,2.4,3.6,4.8,6,7.2]:[])].map((at,i)=><Sequence key={i} from={Math.round(at*30)} durationInFrames={12}><Audio src={staticFile('tick.wav')} volume={1}/></Sequence>)}</>}
  </AbsoluteFill>;
};
export const Film:React.FC<VideoProps>=(props)=><AbsoluteFill>{timeline(props.cut,props.audio).map(({scene,from,durationInFrames})=><Sequence key={scene.id} name={`${scene.id} · ${scene.title}`} from={from} durationInFrames={durationInFrames}><SceneView scene={scene} seconds={durationInFrames/30} props={props}/></Sequence>)}</AbsoluteFill>;
