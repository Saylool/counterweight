import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import fills from './recorded-fills.json';
import {hookHeadline, hookBeatTimes, keeperStage, lifecycleSummaries, lifecycleTxIndices, narrationAt, rogueFocus, terminalExcerpt, terminalTone, type Scene, type VideoProps} from './model';
const green='#b6df7c', muted='#a6b4aa', amber='#efbd67';
const mono='"SFMono-Regular", Consolas, monospace';
const v2='1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a';
const v3='052d4d8758a1e470c5d6c32ff8610564c39dde47194d7a4de42f97a2c587838c';
const refs=['H4ecuH…Q1vnt ↗','FnEqLs…LDmp3 ↗','DGcGa5…sS8eT ↗','2ZHrq1…DcFNd ↗','65WWr7…eL8JW ↗'];
export const lifecycleBeats=[
  {title:'Owner funded',detail:'4 wNEAR deposited',sub:'Owner-only 49 USDC · spot → perp'},
  {title:'Policy access keys: 0',detail:'Key deleted before keeper trading',sub:'Committed v2 WASM verified'},
  {title:'Short filled',detail:'Saved verification.fills',sub:'Hyperliquid testnet'},
  {title:'Reduce-only close',detail:'Saved verification.fills + flat',sub:'Hyperliquid testnet'},
];
// Original pixels only. Crops are editorial excerpts, never reconstructed records.
const SourceCrop:React.FC<{asset:string;rect:[number,number,number,number];width:number}>=({asset,rect,width})=>
 <div style={{width,height:width/rect[2]*rect[3],overflow:'hidden',position:'relative'}}>
  <Img src={staticFile(asset)} style={{position:'absolute',width:1920*width/rect[2],height:1080*width/rect[2],maxWidth:'none',left:-rect[0]*width/rect[2],top:-rect[1]*width/rect[2]}}/>
 </div>;
const FillRecord:React.FC<{close:boolean}>=({close})=>{
 const record=fills[close?'close':'open'],fill=record.verification.fills[0]!;
 return <>
  <div style={{fontSize:24,color:green,marginBottom:16}}>RECORDED HYPERLIQUID TESTNET · SAVED JSON EXCERPT</div>
  <div style={{fontFamily:mono,fontSize:31,lineHeight:1.3,background:'#0c1510',padding:'22px 28px',borderRadius:14}}>
   <div style={{color:muted,fontSize:25}}>verification.fills[0] · selected fields</div>
   <div>{'{ "coin": '}{JSON.stringify(fill.coin)}{', "side": '}{JSON.stringify(fill.side)}{', "oid": '}{fill.oid}{','}</div>
   <div style={{margin:'10px 0'}}>  {'"sz": '}<strong style={{fontSize:64,color:green}}>{JSON.stringify(fill.sz)}</strong>{', "px": '}<strong style={{fontSize:64,color:green}}>{JSON.stringify(fill.px)}</strong>{' }'}</div>
   <div style={{color:muted,fontSize:25}}>verification</div>
   <div>{'{ "fullFill": true, '}<strong style={{fontSize:close?58:31,color:close?green:muted}}>{'"flat": '}{String(record.verification.flat)}</strong>{' }'}</div>
  </div>
  <div style={{fontSize:18,color:muted,marginTop:15,fontFamily:mono}}>{record.source}</div>
 </>;
};
export const XProof:React.FC<{scene:Scene;seconds:number}>=({scene,seconds})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),hook=scene.id==='A1',t=f/fps,hookRevealAt=hookBeatTimes(seconds);
 const active=hook?0:t>=narrationAt('A3','and closed',seconds)?3:t>=narrationAt('A3','The keeper',seconds)?2:t>=narrationAt('A3','then deleted',seconds)?1:0;
 const cards=hook?[
  {title:'0 ACCESS KEYS',detail:'Policy key deleted',sub:refs[2]},
  {title:'BOUNDED OPEN',detail:'Keeper hedge request',sub:refs[3]},
  {title:'REDUCE-ONLY FLAT',detail:'Position closed',sub:refs[4]},
 ]:lifecycleBeats;
 return <div style={{position:'absolute',left:90,top:150,width:1740,height:688}}>
  {hook?<>
   <div style={{fontSize:53,lineHeight:1.16,fontWeight:650,maxWidth:1700,marginBottom:22}}>{hookHeadline}</div>
   <div style={{display:'flex',gap:22,alignItems:'center',fontSize:37,marginBottom:24,color:green}}>
    <div style={{padding:'12px 24px',border:'1px solid #61784b',borderRadius:12}}>NEAR holdings</div><span>+</span><div style={{padding:'12px 24px',border:'1px solid #61784b',borderRadius:12}}>short hedge</div>
   </div>
   <div style={{fontFamily:mono,color:muted,fontSize:23,marginBottom:20}}>policy-v2.counterweight-samet.testnet</div>
   {cards.map((beat,i)=>{
    const entrance=Math.max(0,Math.min(1,(t-hookRevealAt[i]!)/.4));
    const focus=Math.min(2,Math.max(0,hookRevealAt.filter(at=>t>=at).length-1))===i;
    return <div key={i} style={{display:'flex',alignItems:'center',gap:24,border:`1px solid ${focus?green:'#344038'}`,borderRadius:18,background:'#17201b',padding:'18px 26px',marginBottom:14,opacity:entrance,transform:`translateY(${(1-entrance)*18}px)`}}>
     <div style={{fontSize:44,color:green}}>✓</div><div style={{width:470,fontSize:37,fontWeight:650}}>{beat.title}</div>
     <div style={{flex:1,fontSize:30}}>{beat.detail}</div><div style={{fontSize:23,color:muted,fontFamily:mono}}>{beat.sub}</div>
    </div>;
   })}
  </>:<>
   <div style={{display:'flex',gap:20,marginBottom:24}}>{cards.map((beat,i)=><div key={i} style={{flex:1,borderTop:`5px solid ${i<=active?amber:'#344038'}`,paddingTop:16,color:i===active?amber:muted,fontSize:27}}>{i+1}. {['Owner funded','Policy keys: 0','Short filled','Position flat'][i]}</div>)}</div>
   <div style={{border:`3px solid ${amber}`,borderRadius:24,padding:'24px 32px',height:506,boxSizing:'border-box',background:'#17201b'}}>
    <div style={{color:amber,fontSize:24,marginBottom:14}}>RECORDED V2 · {cards[active]!.title}</div>
    {active>=2?<FillRecord close={active===3}/>:<>
     <div style={{fontSize:72,lineHeight:1.1,fontWeight:650,marginBottom:28}}>{cards[active]!.title}</div>
     <div style={{fontSize:44,marginBottom:24}}>{cards[active]!.detail}</div><div style={{fontSize:31,color:muted}}>{cards[active]!.sub}</div>
     <div style={{fontSize:31,color:green,lineHeight:1.35,marginTop:46,padding:'24px 26px',background:'#253322',borderRadius:14}}>{lifecycleSummaries[active]}</div>
    </>}
   </div>
   <div style={{marginTop:18,fontSize:22,color:muted}}>9 VERIFIED STEPS · RECORDED V2 · WASM {v2.slice(0,8)}…{v2.slice(-5)}</div>
   <div style={{marginTop:14,fontSize:23,fontFamily:mono,color:green,display:'flex',justifyContent:'space-between'}}>{refs.map((ref,i)=><span key={ref} style={{color:lifecycleTxIndices[active]!.includes(i)?amber:muted,fontWeight:lifecycleTxIndices[active]!.includes(i)?750:400}}>{ref}</span>)}</div>
  </>}
 </div>;
};
export const XWithdrawal:React.FC<{seconds:number}>=({seconds})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),v3Beat=f/fps>=narrationAt('A4','Separately,',seconds);
 return <div style={{position:'absolute',left:90,top:150,width:1740,height:688,padding:'24px 32px',boxSizing:'border-box',border:`2px solid ${amber}`,borderRadius:18,background:'#17201b'}}>
  {!v3Beat?<>
   <div style={{fontSize:35,fontWeight:650,marginBottom:10}}>Recorded funded run</div>
   <div style={{fontSize:22,color:muted,marginBottom:18}}>RECORDED V2 · HYPURRSCAN · ORIGINAL WITHDRAWAL ROW · 0xdf68992e…</div>
   <div style={{display:'flex',gap:36,alignItems:'start',marginBottom:24}}>
    <div><div style={{fontSize:20,color:muted,marginBottom:8}}>METHOD · SOURCE EXCERPT</div><SourceCrop asset="captures/hl-fills.png" rect={[310,294,240,92]} width={600}/></div>
    <div><div style={{fontSize:20,color:muted,marginBottom:8}}>AMOUNT / TOKEN · SOURCE EXCERPT</div><SourceCrop asset="captures/hl-fills.png" rect={[1228,294,310,92]} width={775}/></div>
   </div>
   <div style={{fontSize:64,color:green,lineHeight:1.16,marginBottom:10}}>46.957074 USDC net</div>
   <div style={{fontSize:23,color:muted,marginBottom:16}}>Exact amount from saved lifecycle status · explorer rounds to 46.96</div>
   <div style={{fontSize:42,color:amber,marginBottom:16}}>Destination arrival unverified</div>
   <div style={{fontSize:25,color:muted}}>47.957074 USDC gross · 1 USDC fee · fixed recipient 0xb1af…f36a</div>
   <div style={{fontSize:20,color:muted,marginTop:16}}>docs/evidence/2026-11-10-lifecycle-status.md</div>
  </>:<>
   <div style={{fontSize:35,fontWeight:650,marginBottom:10}}>Separate keyless v3 deployment</div>
   <div style={{fontSize:22,color:muted,marginBottom:18}}>V3 · FINALIZED VERIFIER · ORIGINAL CAPTURE</div>
   <SourceCrop asset="captures/v3-proof.png" rect={[80,138,1040,245]} width={1248}/>
   <div style={{fontSize:42,color:green,marginTop:22}}>Reduce-only exits outside the opening price band</div>
   <div style={{fontSize:29,color:amber,marginTop:16}}>Signature authorization · IOC fill not guaranteed</div>
   <div style={{fontFamily:mono,fontSize:20,color:muted,marginTop:26}}>Committed WASM SHA-256 · {v3}</div>
  </>}
 </div>;
};
const OwnerLine:React.FC<{text:string}>=({text})=><>{text.split(/(nonce=\d+|\(unchanged\))/).map((part,i)=><span key={i} style={/^(nonce=|\(unchanged\))/.test(part)?{color:green,fontWeight:750,background:'#30432a',padding:'3px 5px',borderRadius:4}:undefined}>{part}</span>)}</>;
export const XTerminal:React.FC<{scene:Scene;seconds:number;rows:VideoProps['terminal']}>=({scene,seconds,rows})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig(),rogue=scene.kind==='rogue',t=f/fps;
 const excerpt=terminalExcerpt(rows,rogue),focus=rogueFocus(t,seconds),stage=keeperStage(t,seconds);
 // All seven rejects stay visible, dimmed except for the two narrated examples.
 const visible=rogue?excerpt.filter(row=>row.number<=46||t>=narrationAt('A6','After a timeout',seconds)):excerpt.filter(row=>row.number<=10||(stage>=2&&row.number===16)||(stage>=3&&[36,50].includes(row.number)));
 return <div style={{position:'absolute',left:72,top:150,width:1776,height:688}}>
  {!rogue&&<div style={{fontSize:39,fontWeight:650,lineHeight:1.25,color:green,padding:'12px 22px',background:'#253322',borderLeft:`5px solid ${green}`,borderRadius:12,marginBottom:14}}><div>Local simulation: +32.5% / 24h</div><div>Reduce-only close · owner nonce/balance unchanged</div></div>}
  <div style={{display:'flex',gap:22}}>
   <div style={{width:rogue?1260:1776,minWidth:0,border:'1px solid #344038',borderRadius:18,background:'#0c1510',boxSizing:'border-box',padding:'20px 24px'}}>
    <div style={{color:muted,fontSize:22,marginBottom:12,fontFamily:mono}}>● ● ● counterweight / demo:local / {rogue?'rogue':'keeper'}</div>
    {visible.map(row=>{
     const tone=terminalTone(row.text),selected=rogue?row.number===focus:stage===0?[3,10].includes(row.number):stage===1?row.number===3:stage===2?row.number===16:[36,50].includes(row.number);
     return <React.Fragment key={row.number}>
      {row.number===46&&<div style={{fontFamily:mono,color:muted,fontSize:20,borderTop:'1px solid #526052',paddingTop:12,margin:'12px 0 8px'}}>DEAD-MAN TIMELOCK CHECK · SEPARATE FROM 7 TESTED REQUESTS</div>}
      {!rogue&&row.number===16&&<div style={{fontFamily:mono,fontSize:23,color:muted,whiteSpace:'pre',paddingLeft:78,marginBottom:8}}>{'TIME UTC         NEAR       H       ACTION                 RESULT'}</div>}
      <div style={{display:'flex',gap:14,fontFamily:mono,fontSize:rogue?22:23,lineHeight:1.4,marginBottom:rogue?8:10,padding:rogue?'3px 8px':'6px 10px',borderLeft:`4px solid ${selected?amber:'transparent'}`,background:selected?'#253322':'transparent',opacity:rogue&&!selected ? .36 : 1,color:tone==='timelock'?amber:tone==='reject'?'#ff777d':tone==='success'?'#69e2a8':'#edf0e9'}}>
       <span style={{flex:'0 0 48px',color:muted}}>{String(row.number).padStart(3,'0')}</span>
       <span style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',minWidth:0}}>{[10,50].includes(row.number)?<OwnerLine text={row.text}/>:!rogue&&row.number===3?row.text.split(/(\+32\.499065% \/ 4297 windows)/).map((part,i)=><span key={i} style={stage===1&&part.startsWith('+32.')?{color:amber,fontWeight:750,background:'#433620',padding:'3px 5px',borderRadius:4}:undefined}>{part}</span>):rogue&&[37,39].includes(row.number)?row.text.split(/(increase beyond caps|withdraw to rogue)/).map((part,i)=><span key={i} style={selected&&/^(increase beyond caps|withdraw to rogue)$/.test(part)?{color:amber,fontWeight:750}:undefined}>{part}</span>):row.text}</span>
      </div>
     </React.Fragment>;
    })}
    <div style={{color:muted,fontSize:18,marginTop:12}}>ACTUAL SAVED TRANSCRIPT · ORIGINAL LINE NUMBERS · EDITED REVEAL</div>
   </div>
   {rogue&&<div style={{flex:1,padding:'20px 10px'}}>
    <div style={{fontSize:54,color:green,lineHeight:1.1,marginBottom:24}}>7/7 tested cases</div>
    <div style={{fontSize:30,color:muted,lineHeight:1.3,marginBottom:30}}>Unauthorized requests rejected</div>
    <div style={{fontSize:32,lineHeight:1.25,padding:'22px 18px',border:`2px solid ${focus===49?amber:'#344038'}`,borderRadius:18,color:focus===49?amber:muted,background:'#17201b'}}>Recovery after timeout<br/>+601 s · mocked signature</div>
   </div>}
  </div>
 </div>;
};
