import React from 'react';
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

// X: three happy-path steps only. Packet rail stays above every node title.
const XArchitecture:React.FC<{seconds:number}>=({seconds})=>{
  const f=useCurrentFrame(), {fps}=useVideoConfig();
  const t=f/fps/seconds*13, beat=t<4?0:t<8?1:2;
  const centers=[260,730,1200,1650];
  const labels=['Owner sets caps & deletes key','Keeper proposes bounded hedge','Policy verifies bounds → NEAR MPC signs'];
  const rail=(a:number,b:number)=><path d={`M${a} 355 V250 H${b} V355`} fill="none" stroke="#62778d" strokeWidth={3}/>;
  const packet=(a:number,b:number,p:number,label:string,color:string)=>{
    const x=a+(b-a)*ease(p);
    return <g transform={`translate(${x} 222)`}><rect x={-205} y={-23} width={410} height={46} rx={12} fill="#17263b" stroke={color}/><text y={8} textAnchor="middle" fontSize={23} fill={color}>{label}</text><circle cy={28} r={8} fill={color}/></g>;
  };
  return <AbsoluteFill style={{background:'#0f172a',top:140,height:700}}>
    <svg width="1920" height="700" viewBox="0 0 1920 700" style={{fontFamily:'Arial, sans-serif'}}>
      <text x={90} y={62} fill="#94a3b8" fontSize={24}>ONE POLICY. BOUNDED AUTHORITY.</text>
      <text x={90} y={120} fill="#f1f5f9" fontSize={40}>{beat+1}. {labels[beat]}</text>
      {centers.slice(0,3).map((x,i)=><React.Fragment key={x}>{rail(x,centers[i+1]!)}</React.Fragment>)}
      <path d="M730 560V510" stroke={C.keeper} strokeWidth={3}/>
      <Node x={260} y={440} color={C.owner} title="Owner Wallet" sub="Caps · fixed recipient"/>
      <Node x={730} y={440} color={C.policy} title="NEAR Policy Contract" sub="Checks every request" badge={t>=3?'0 ACCESS KEYS':'Owner sets policy'}/>
      <Node x={1200} y={440} color={C.mpc} title="NEAR MPC" sub="v1.signer" badge="Chain Signatures"/>
      <Node x={1650} y={440} color={C.venue} title="Hyperliquid Account" sub="Testnet · 0x3e72…5390"/>
      <g transform="translate(570 565)"><rect width={320} height={90} rx={16} fill="#162137" stroke={C.keeper}/><text x={160} y={38} textAnchor="middle" fontSize={28} fill={C.keeper}>Keeper Bot</text><text x={160} y={69} textAnchor="middle" fontSize={21} fill="#b4c2d4">Proposes bounded hedge</text></g>
      {beat===0&&packet(260,730,t/4,'Caps & key deletion',C.owner)}
      {beat===1&&packet(730,730,(t-4)/4,'Bounded hedge proposal',C.keeper)}
      {beat===2&&(t<10.5?packet(730,1200,(t-8)/2.5,'Bounds verified · signing request',C.mpc):packet(1200,1650,(t-10.5)/2.5,'Signed ECDSA order',C.venue))}
    </svg>
  </AbsoluteFill>;
};
export const Architecture:React.FC<{judge:boolean;seconds?:number}>=({judge,seconds=13})=>judge?<LegacyArchitecture judge/>:<XArchitecture seconds={seconds}/>;
