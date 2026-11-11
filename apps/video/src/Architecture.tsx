import React from 'react';
import {architectureHeadlines, architectureStage, narrationAt} from './model';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const C = {owner:'#f59e0b',keeper:'#38bdf8',policy:'#a855f7',mpc:'#22c55e',venue:'#10b981',red:'#ef4444'};
const point = (a: number[], b: number[], p: number) => [a[0]! + (b[0]!-a[0]!) * p, a[1]! + (b[1]!-a[1]!) * p];
const clamp = (n:number) => Math.max(0,Math.min(1,n));
const ease = (n:number) => {const p=clamp(n);return p*p*(3-2*p);};
const owner=[325,295], keeper=[325,595], policy=[785,445], mpc=[1195,445], venue=[1595,445];
function Node({x,y,color,title,sub,badge}:{x:number;y:number;color:string;title:string;sub:string;badge?:string}) {
  return <g transform={`translate(${x-160} ${y-85})`}>
    <rect width={320} height={170} rx={20} fill="#162137" stroke={color} strokeWidth={2}/>
    <rect x={22} y={22} width={7} height={7} rx={2} fill={color}/>
    <text x={22} y={64} fontSize={28} fontWeight={650} fill="#f1f5f9">{title}</text>
    <text x={22} y={98} fontSize={23} fill="#b4c2d4">{sub}</text>
    {badge?.startsWith('0 ACCESS')&&<g transform="translate(278 20)"><rect x={-4} y={8} width={22} height={18} rx={3} stroke={color} strokeWidth={2} fill="none"/><path d="M0 8V3a7 7 0 0 1 14 0v5" stroke={color} strokeWidth={2} fill="none"/></g>}
    {badge && <text x={22} y={143} fontSize={21} fontWeight={700} fill={color}>{badge}</text>}
  </g>;
}
function Packet({a,b,progress,color,label}:{a:number[];b:number[];progress:number;color:string;label:string}) {
  const [x,y]=point(a,b,ease(progress));
  return <g transform={`translate(${x} ${y})`}><circle r={14} fill={color}/><circle r={27} stroke={color} fill="none" opacity={.25}/><rect x={-200} y={-64} width={400} height={38} rx={9} fill="#0b1220"/><text textAnchor="middle" y={-38} fill={color} fontSize={21}>{label}</text></g>;
}
const LegacyArchitecture:React.FC<{judge:boolean}>=({judge})=>{
  const f=useCurrentFrame(), {fps}=useVideoConfig();
  const t=f/fps, beat=t<4?0:t<9?1:t<14?2:3;
  const burned=t>=2.9, blocked=t>=10.55 && t<14;
  const beatLabels=['Owner configures. Contract key is burned.','Valid keeper request → constrained signature.','Rogue request reverts before MPC signing.','Public recovery after +601s timeout.'];
  const label=beatLabels[Math.min(beat,judge?3:2)];
  const lines=[[owner,policy,C.owner],[keeper,policy,beat===2?C.red:C.keeper],[policy,mpc,C.mpc],[mpc,venue,C.venue]] as const;
  return <AbsoluteFill style={{background:'#0f172a',top:122,height:744}}>
    <svg width="1920" height="744" viewBox="0 0 1920 744" style={{fontFamily:'Arial, sans-serif'}}>
      <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#334155" opacity=".45"/></pattern></defs>
      <rect width="1920" height="744" fill="url(#grid)"/>
      <text x={90} y={77} fill="#94a3b8" fontSize={22} letterSpacing={4}>ONE POLICY. BOUNDED AUTHORITY.</text>
      <text x={90} y={128} fill="#f1f5f9" fontSize={40} fontWeight={600}>{label}</text>
      {lines.map(([a,b,c],i)=><path key={i} d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={beat===2&&i>=2?'#243047':c} strokeWidth={3} opacity={.6}/>)}
      <Node x={owner[0]!} y={owner[1]!} color={C.owner} title="Owner Wallet" sub="Risk caps · fixed recipient" badge={beat===3?'UNTOUCHED · nonce frozen':undefined}/>
      <Node x={keeper[0]!} y={keeper[1]!} color={beat===2?C.red:C.keeper} title={beat===2?'Rogue Keeper':'Keeper Bot'} sub={beat===2?'Withdraw / over-cap / agent':'Bounded short / reduce-only'}/>
      <Node x={policy[0]!} y={policy[1]!} color={blocked?C.red:t>=5.6&&t<6.8?C.mpc:C.policy} title="NEAR Policy Contract" sub="policy-v2 / v3" badge={burned?'0 ACCESS KEYS · immutable':'Owner sets policy'}/>
      <Node x={mpc[0]!} y={mpc[1]!} color={C.mpc} title="NEAR MPC" sub="v1.signer" badge="path: counterweight-1"/>
      <Node x={venue[0]!} y={venue[1]!} color={C.venue} title="Hyperliquid Account" sub="Testnet · 0x3e72…5390" badge={t>=8?'Flat 0.0 NEAR':t>=7.1?'Short 3.5 NEAR':'Awaiting order'}/>
      {t<2.8&&<Packet a={owner} b={policy} progress={t/2.8} color={C.owner} label="4 wNEAR + 49 USDC · caps · recipient"/>}
      {t>=2.8&&t<3.6&&<g opacity={1-clamp((t-3)/.6)} transform={`translate(785 330) scale(${1+(t-2.8)*1.4})`}><circle r={14} stroke={C.owner} strokeWidth={6} fill="none"/><path d="M12 0h45m-12 0v15m-14-15v15" stroke={C.owner} strokeWidth={7}/></g>}
      {t>=4&&t<5.6&&<Packet a={keeper} b={policy} progress={(t-4)/1.6} color={C.keeper} label="IOC short / reduce-only close"/>}
      {t>=5.6&&t<7.1&&<Packet a={policy} b={mpc} progress={(t-5.6)/1.5} color={C.mpc} label="Caps & cooldown OK · typed request"/>}
      {t>=7.1&&t<8.7&&<Packet a={mpc} b={venue} progress={(t-7.1)/1.6} color={C.venue} label="Signed ECDSA payload"/>}
      {t>=9&&t<10.6&&<Packet a={keeper} b={policy} progress={(t-9)/1.6} color={C.red} label="Rogue withdrawal / leverage spike"/>}
      {blocked&&<g><circle cx={785} cy={445} r={116+Math.sin(f*.3)*4} fill="none" stroke={C.red} strokeWidth={3} opacity={.5}/><path d="M751 410l68 68m0-68l-68 68" stroke={C.red} strokeWidth={12}/>{Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9,p=clamp((t-10.55)/.8);return <rect key={i} x={785+Math.cos(a)*p*180} y={445+Math.sin(a)*p*180} width={11} height={11} fill={C.red} opacity={1-p}/>;})}<text x={785} y={585} textAnchor="middle" fontSize={28} fill={C.red} fontWeight={700}>REVERT: 7/7 BLOCKED</text><text x={1195} y={585} textAnchor="middle" fontSize={25} fill="#94a3b8">0 signatures issued</text></g>}
      {judge&&t>=14&&<><text x={785} y={310} textAnchor="middle" fontSize={30} fill="white">+{Math.round(interpolate(t,[14,15],[590,601],{extrapolateRight:'clamp'}))}s timeout</text>{t>=15&&t<16.8&&<Packet a={policy} b={mpc} progress={(t-15)/1.8} color="#fff" label="Dead-man reduce-only close"/>}{t>=16.8&&t<18.6&&<Packet a={mpc} b={venue} progress={(t-16.8)/1.8} color="#fff" label="Recovery signature"/>}</>}
    </svg>
  </AbsoluteFill>;
};

// X: the signing path is directional; owner configuration is a separate edge.
const XArchitecture:React.FC<{seconds:number}>=({seconds})=>{
  const f=useCurrentFrame(), {fps}=useVideoConfig(),t=f/fps;
  const active=architectureStage(t,seconds), activeNodes=active===0?[1]:active===1?[0]:active===2?[1]:[2,3];
  const xs=[250,710,1200,1660], widths=[320,350,390,330];
  const nodes=[
    {title:['Keeper'],sub:'Proposes an order',badge:'Bounded hedge request',color:C.keeper},
    {title:['Policy checks'],sub:'NEAR policy contract',badge:'0 ACCESS KEYS',color:C.policy},
    {title:['NEAR Chain','Signatures'],sub:'v1.signer',badge:'Typed ECDSA signature',color:C.mpc},
    {title:['Hyperliquid'],sub:'Testnet exchange',badge:'0x3e72…5390',color:C.venue},
  ];
  return <AbsoluteFill style={{background:'#0f172a',top:140,height:700}}>
    <svg width="1920" height="700" viewBox="0 0 1920 700" style={{fontFamily:'Arial, sans-serif'}}>
      <defs>{[C.keeper,C.policy,C.mpc,C.owner].map((color,i)=><marker key={color} id={`x-arrow-${i}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={9} markerHeight={9} orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill={color}/></marker>)}</defs>
      <text x={90} y={62} fill="#94a3b8" fontSize={24}>ONE POLICY. BOUNDED AUTHORITY.</text>
      <text x={90} y={120} fill="#f1f5f9" fontSize={40}>{architectureHeadlines[active]}</text>
      <text x={90} y={190} fill={C.policy} fontSize={28}>Enforced bound: keeper cannot change the fixed withdrawal recipient</text>
      {xs.slice(0,3).map((x,i)=>{
        const a=x+widths[i]!/2+10,b=xs[i+1]!-widths[i+1]!/2-15,color=nodes[i]!.color;
        const starts=[narrationAt('A2','The keeper proposes',seconds),narrationAt('A2','the contract checks',seconds),narrationAt('A2','and NEAR Chain',seconds)];
        const ends=[starts[1]!,starts[2]!,narrationAt('A2','for Hyperliquid',seconds)];
        const p=clamp((t-starts[i]!)/(ends[i]!-starts[i]!));
        return <g key={i}><path d={`M${a} 350H${b}`} stroke={color} opacity={active===i+1?1:.3} strokeWidth={active===i+1?6:3} fill="none" markerEnd={`url(#x-arrow-${i})`}/>{p>0&&p<1&&<circle cx={a+(b-a)*p} cy={350} r={8} fill={color}/>}</g>;
      })}
      {nodes.map((n,i)=><g key={i} transform={`translate(${xs[i]!-widths[i]!/2} 250)`}>
        <rect width={widths[i]} height={200} rx={20} fill="#162137" stroke={n.color} strokeWidth={activeNodes.includes(i)?5:2} opacity={activeNodes.includes(i)?1:.65}/>
        {n.title.map((line,j)=><text key={line} x={22} y={48+j*33} fontSize={30} fontWeight={650} fill="#f1f5f9">{line}</text>)}
        <text x={22} y={n.title.length>1?119:101} fontSize={24} fill="#b4c2d4">{n.sub}</text>
        <text x={22} y={170} fontSize={22} fill={n.color}>{n.badge}</text>
        {i===1&&<g transform="translate(224 151)"><rect x={0} y={8} width={22} height={18} rx={3} stroke={n.color} strokeWidth={2} fill="none"/><path d="M4 8V3a7 7 0 0 1 14 0v5" stroke={n.color} strokeWidth={2} fill="none"/></g>}
      </g>)}
      <g transform="translate(90 535)"><rect width={590} height={90} rx={16} fill="#162137" stroke={C.owner}/><text x={22} y={54} fontSize={25} fill={C.owner}>Owner configuration: caps + fixed recipient</text></g>
      <path d="M695 580H710V465" stroke={C.owner} strokeWidth={3} strokeDasharray="10 9" strokeDashoffset={-t*25} fill="none" markerEnd="url(#x-arrow-3)"/>
    </svg>
  </AbsoluteFill>;
};
export const Architecture:React.FC<{judge:boolean;seconds?:number}>=({judge,seconds=13})=>judge?<LegacyArchitecture judge/>:<XArchitecture seconds={seconds}/>;
