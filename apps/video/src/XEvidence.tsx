import React from 'react';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {hookHeadline, hookRevealAt, revealCount, terminalExcerpt, type Scene, type VideoProps} from './model';
const green='#b6df7c', muted='#a6b4aa', amber='#efbd67';
const mono='"SFMono-Regular", Consolas, monospace';
const v2='1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a';
const v3='052d4d8758a1e470c5d6c32ff8610564c39dde47194d7a4de42f97a2c587838c';
const refs=['H4ecuH…Q1vnt ↗','FnEqLs…LDmp3 ↗','DGcGa5…sS8eT ↗','2ZHrq1…DcFNd ↗','65WWr7…eL8JW ↗'];
export const lifecycleBeats=[
  {title:'Owner funded',detail:'4 wNEAR deposited',sub:'Owner-only 49 USDC · spot → perp'},
  {title:'Policy access keys: 0',detail:'Key deleted before keeper trading',sub:'Committed v2 WASM verified'},
  {title:'3.5 NEAR short filled',detail:'Keeper IOC short @ 3.5121',sub:'Hyperliquid testnet · oid 65016476566'},
  {title:'Reduce-only close, position flat',detail:'3.5 NEAR @ 3.5212',sub:'Net perp position: 0.0 NEAR'},
];
// Original pixels only. Crops are editorial excerpts, never reconstructed records.
const SourceCrop:React.FC<{asset:string;rect:[number,number,number,number];width:number}>=({asset,rect,width})=>
 <svg viewBox={rect.join(' ')} width={width} height={width/rect[2]*rect[3]} style={{display:'block',maxWidth:'100%'}}><image href={staticFile(asset)} width="1920" height="1080"/></svg>;
export const XProof:React.FC<{scene:Scene;seconds:number}>=({scene,seconds})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),hook=scene.id==='A1',t=f/fps;
 const active=Math.min(3,Math.floor(t/seconds*4)),beatTime=t-active*seconds/4;
 const showRecord=active>=2&&beatTime>=.5&&beatTime<seconds/4-.3;
 const cards=hook?[
  {title:'Policy keys: 0',detail:'Policy key deleted',sub:refs[2]},
  {title:'Short filled',detail:'3.5 NEAR @ 3.5121',sub:refs[3]},
  {title:'Position flat',detail:'Reduce-only close 3.5 NEAR @ 3.5212',sub:refs[4]},
 ]:lifecycleBeats;
 return <div style={{position:'absolute',left:90,top:150,width:1740,height:688}}>
  {hook?<>
   <div style={{fontSize:53,lineHeight:1.16,fontWeight:650,maxWidth:1700,marginBottom:26}}>{hookHeadline}</div>
   <div style={{fontFamily:mono,color:muted,fontSize:24,marginBottom:24}}>policy-v2.counterweight-samet.testnet</div>
   {cards.map((beat,i)=>{
    const entrance=Math.max(0,Math.min(1,(t-hookRevealAt[i]!)/.4));
    const focus=Math.floor(Math.max(0,t-.6)/2.4)%3===i;
    return <div key={i} style={{display:'flex',alignItems:'center',gap:24,border:`1px solid ${focus?green:'#344038'}`,borderRadius:18,background:'#17201b',padding:'18px 26px',marginBottom:14,opacity:entrance,transform:`translateY(${(1-entrance)*18}px)`}}>
     <div style={{fontSize:48,color:green}}>✓</div><div style={{width:390,fontSize:41,fontWeight:650}}>{beat.title}</div>
     <div style={{flex:1,fontSize:32}}>{beat.detail}</div><div style={{fontSize:21,color:muted,fontFamily:mono}}>{beat.sub}</div>
    </div>;
   })}
  </>:<>
   <div style={{display:'flex',gap:20,marginBottom:30}}>{cards.map((beat,i)=><div key={i} style={{flex:1,borderTop:`5px solid ${i<=active?amber:'#344038'}`,paddingTop:16,color:i===active?amber:muted,fontSize:27}}>{i+1}. {['Owner funded','Policy keys: 0','Short filled','Position flat'][i]}</div>)}</div>
   <div style={{border:`3px solid ${amber}`,borderRadius:24,padding:'34px 40px',height:440,boxSizing:'border-box',background:'#17201b'}}>
    <div style={{color:amber,fontSize:26,marginBottom:22}}>RECORDED V2 · EVIDENCE {active+1} / 4</div>
    <div style={{fontSize:showRecord?48:active===3?60:72,lineHeight:1.1,fontWeight:650,marginBottom:showRecord?14:28}}>{cards[active]!.title}</div>
    {showRecord?<>
     <div style={{fontSize:24,color:green,marginBottom:10}}>Recorded Hyperliquid testnet fill</div>
     <SourceCrop asset="captures/lifecycle-scroll.png" rect={[376,active===2?256:319,680,63]} width={1640}/>
     <div style={{fontSize:21,color:muted,marginTop:8}}>Saved lifecycle table · original captured record</div>
    </>:<><div style={{fontSize:44,marginBottom:24}}>{cards[active]!.detail}</div><div style={{fontSize:31,color:muted}}>{cards[active]!.sub}</div></>}
   </div>
   <div style={{marginTop:24,fontSize:23,color:muted}}>9 VERIFIED STEPS · RECORDED V2 · WASM {v2.slice(0,8)}…{v2.slice(-5)}</div>
   <div style={{marginTop:16,fontSize:24,fontFamily:mono,color:green,display:'flex',justifyContent:'space-between'}}>{refs.map(ref=><span key={ref}>{ref}</span>)}</div>
  </>}
 </div>;
};
export const XWithdrawal:React.FC<{seconds:number}>=({seconds})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),beat=Math.min(2,Math.floor(f/fps/seconds*3));
 return <div style={{position:'absolute',left:60,top:150,width:1800,height:688,display:'flex',gap:24}}>
  <div style={{width:1160,padding:22,boxSizing:'border-box',border:`2px solid ${beat<2?amber:'#344038'}`,borderRadius:18,background:'#17201b'}}>
   <div style={{fontSize:24,color:muted,marginBottom:22}}>HYPURRSCAN · ORIGINAL WITHDRAWAL ROW · 0xdf68992e…</div>
   <div style={{display:'flex',gap:12,alignItems:'start',marginBottom:26}}>
    <div><div style={{fontSize:20,color:muted,marginBottom:8}}>METHOD · SOURCE EXCERPT</div><SourceCrop asset="captures/hl-fills.png" rect={[310,294,240,92]} width={480}/></div>
    <div><div style={{fontSize:20,color:muted,marginBottom:8}}>AMOUNT / TOKEN · SOURCE EXCERPT</div><SourceCrop asset="captures/hl-fills.png" rect={[1228,294,310,92]} width={620}/></div>
   </div>
   <div style={{fontSize:48,color:green,lineHeight:1.16,marginBottom:12}}>46.957074 USDC net</div>
   <div style={{fontSize:22,color:muted,marginBottom:20}}>Exact recorded amount · saved lifecycle status evidence</div>
   <div style={{fontSize:28,color:muted,lineHeight:1.5}}>47.957074 USDC gross · 1 USDC fee<br/>Fixed recipient: 0xb1af…f36a</div>
   <div style={{fontSize:32,color:beat===1?amber:muted,marginTop:20}}>Destination arrival unverified</div>
   <div style={{fontSize:20,color:muted,marginTop:18}}>docs/evidence/2026-11-10-lifecycle-status.md</div>
  </div>
  <div style={{flex:1,minWidth:0,padding:22,border:`2px solid ${beat===2?amber:'#344038'}`,borderRadius:18,background:'#17201b'}}>
   <div style={{fontSize:23,color:muted,marginBottom:20}}>FINALIZED VERIFIER · ORIGINAL CAPTURE</div>
   <SourceCrop asset="captures/v3-proof.png" rect={[80,138,1100,435]} width={568}/>
   <div style={{fontSize:23,color:muted,marginTop:22}}>SHA-256 · committed WASM</div>
   <div style={{fontFamily:mono,fontSize:22,lineHeight:1.5,overflowWrap:'anywhere',marginTop:8}}>{v3}</div>
   <div style={{fontSize:33,color:beat===2?green:muted,lineHeight:1.3,marginTop:24}}>Protective exits outside opening band</div>
   <div style={{fontSize:23,color:muted,marginTop:12}}>Signature authorization · IOC fill not guaranteed</div>
  </div>
 </div>;
};
export const XTerminal:React.FC<{scene:Scene;seconds:number;rows:VideoProps['terminal']}>=({scene,seconds,rows})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),rogue=scene.kind==='rogue',t=f/fps;
 const beat=Math.min(2,Math.floor(t/seconds*3));
 const excerpt=terminalExcerpt(rows,rogue);
 const visible=excerpt.slice(0,revealCount(t,seconds,excerpt.length));
 return <div style={{position:'absolute',left:72,top:150,width:1776,height:688,display:'flex',gap:22}}>
  <div style={{width:rogue?1260:1776,minWidth:0,border:'1px solid #344038',borderRadius:18,background:'#0c1510',boxSizing:'border-box',padding:'22px 26px'}}>
   <div style={{color:muted,fontSize:23,marginBottom:20,fontFamily:mono}}>● ● ● counterweight / demo:local / {rogue?'rogue':'keeper'}</div>
   {visible.map(row=><div key={row.number} style={{display:'flex',gap:14,fontFamily:mono,fontSize:rogue?22:27,lineHeight:1.4,marginBottom:rogue?9:20,padding:rogue?'0':'10px 12px',borderLeft:!rogue&&[16,36].includes(row.number)?`4px solid ${amber}`:'4px solid transparent',background:!rogue&&[16,36].includes(row.number)?'#253322':'transparent',color:/REJECT/.test(row.text)?'#ff777d':/PASS|SIGNED/.test(row.text)?'#69e2a8':'#edf0e9'}}>
    <span style={{flex:'0 0 48px',color:muted}}>{String(row.number).padStart(3,'0')}</span>
    <span style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',minWidth:0}}>{row.text}</span>
   </div>)}
   <div style={{color:muted,fontSize:18,marginTop:16}}>ACTUAL SAVED TRANSCRIPT · ORIGINAL LINE NUMBERS · EDITED REVEAL</div>
  </div>
  {rogue&&<div style={{flex:1,padding:'25px 14px'}}>{['Unauthorized requests blocked','7/7 tested cases','Recovery authorized after timeout (+601s, mocked signature)'].map((label,i)=><div key={label} style={{fontSize:34,lineHeight:1.22,padding:'22px 18px',marginBottom:24,border:`2px solid ${i===beat?amber:'#344038'}`,borderRadius:18,color:i===beat?amber:muted,background:'#17201b'}}>{label}</div>)}</div>}
 </div>;
};
