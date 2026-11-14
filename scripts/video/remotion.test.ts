import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import data from '../../apps/video/src/scenes.json' with {type:'json'};
import {mainnetProofRows} from '../../apps/video/src/XEvidence.js';
import {scenes, timeline, totalFrames, wordCount, subtitleText, subtitleCues, terminalExcerpt, textBand, subtitleSchedule, hookBeatTimes, endCardRevealAt, keeperStage, lifecycleTxIndices, narrationAt, architectureStage, rogueFocus, terminalTone, type Cut} from '../../apps/video/src/model.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=(file:string)=>readFileSync(path.join(root,file),'utf8');
const script=read('apps/video/production-script.md');
const revised=read('apps/video/revised-x-script.md');
const claims=read('docs/CLAIMS.md');
const parse=(text:string)=>text.split('\n').filter(line=>/^\| \*\*[AB]\d+[A-Z]?(?:\.|\*\*)/.test(line)).map(line=>{
  let code=false,part='';const c:string[]=[];
  for(const char of line.replace(/^\||\|$/g,'')){
    if(char==='`')code=!code;
    if(char==='|'&&!code){c.push(part.trim());part='';}else part+=char;
  }
  c.push(part.trim());
  const [start,end]=c[1]!.match(/\d+/g)!.map(Number);
  return {id:c[0]!.match(/\*\*([AB]\d+[A-Z]?)/)![1]!,start,end,visual:c[2],voiceover:c[3],caption:c[4]!.replace(/^\*\*|\*\*$/g,'')};
});
// Long phrases first, then all remaining numeric tokens (including identifiers).
// English cardinals cover future prose additions; any unmapped expression fails.
const numbers=(text:string)=>text.match(/forty-six point nine-six|twenty-four-hour|thirty-two|forty-seven|forty-nine|November (?:tenth|twelfth|fourteenth)|\b(?:policy-)?v\d+(?:\.signer)?\b|\$?\b\d[\d,]*(?:\.\d+)?%?|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|tenth|half)\b/gi)??[];

describe('Remotion production tables and evidence',()=>{
  it('matches every script row, timing, caption, voiceover and visual direction verbatim',()=>{
    const expected=[...parse(revised),...parse(script).filter(row=>row.id.startsWith('B'))];
    expect(scenes).toHaveLength(18);
    expect(scenes.map(({id,start,end,visual,voiceover,caption})=>({id,start,end,visual,voiceover,caption}))).toEqual(expected);
    if(process.env.VIDEO_PRODUCTION_SCRIPT)expect(parse(readFileSync(process.env.VIDEO_PRODUCTION_SCRIPT,'utf8'))).toEqual(parse(revised));
    for(const cut of ['x','judge'] as Cut[]){
      const rows=timeline(cut);
      expect(scenes.filter(s=>s.cut===cut).reduce((n,s)=>n+s.seconds,0)).toBe(cut==='x'?87:165);
      rows.forEach((row,i)=>{
        
        expect(row.durationInFrames).toBe(Math.ceil(Math.max(row.scene.seconds,wordCount(row.scene.voiceover)/2.5+.6)*30));
        expect(row.scene.seconds).toBe(row.scene.end-row.scene.start);
        expect(row.from).toBe(i?rows[i-1]!.from+rows[i-1]!.durationInFrames:0);
        if(row.scene.voiceover)expect(wordCount(row.scene.caption),row.scene.id).toBeLessThanOrEqual(8);
        else expect(row.scene.id).toBe('A4M');
      });
    }
  });
  it('uses natural silent reading pace and audio tails, rippling starts without overlap',()=>{
    for(const cut of ['x','judge'] as Cut[]) {
      const audio={A1:{src:'vo/x/01.mp3',seconds:14.013},A2:{src:'vo/x/02.mp3',seconds:2}};
      const rows=timeline(cut,audio);
      rows.forEach((row,i)=>{
        const clip=audio[row.scene.id as keyof typeof audio];
        expect(row.durationInFrames).toBe(Math.ceil(Math.max(row.scene.seconds,clip?clip.seconds+.4:wordCount(row.scene.voiceover)/2.5+.6)*30));
        expect(row.from).toBe(i?rows[i-1]!.from+rows[i-1]!.durationInFrames:0);
      });
    }
    expect(totalFrames('x')).toBe(2760);
  });
  it('subtitles preserve every exact voiceover word in readable cues',()=>{
    for(const scene of scenes){
      const cues=subtitleCues(subtitleText(scene));
      expect(cues.join(' ')).toBe(subtitleText(scene));
      expect(cues.every(cue=>cue.length<=110 && wordCount(cue)<=16)).toBe(true);
    }
  });
  it('replaces the caption with one subtitle cue in the single text band',()=>{
    for(const {scene,durationInFrames} of timeline('x')){
      const seconds=durationInFrames/30;
      if(scene.voiceover)expect(textBand(scene,false,0,seconds)).toBe(scene.caption);
      else expect(textBand(scene,false,0,seconds)).toBe(subtitleCues(scene.caption)[0]);
      subtitleSchedule(scene,seconds).forEach(cue=>{
        expect(textBand(scene,true,(cue.start+cue.end)/2,seconds)).toBe(cue.text);
      });
    }
    const film=read('apps/video/src/Film.tsx');
    expect(film.match(/data-text-band=/g)).toHaveLength(1);
    expect(film).not.toContain('data-subtitle');
    expect(film).not.toContain('{scene.caption}');
  });
  it('scales proof and terminal beats from narration words at different VO durations',()=>{
    for(const seconds of [10,15,24]) {
      const times=hookBeatTimes(seconds);
      expect(times.every((t,i)=>t>=0&&t<seconds&&(i===0||t>times[i-1]!))).toBe(true);
      for(const [stage,phrase] of ['In a local','NEAR rallied','The keeper closed',"and the owner's"].entries()) {
        const at=narrationAt('A5',phrase,seconds);
        expect(keeperStage(at,seconds)).toBe(stage);
        if(stage>0)expect(keeperStage(at-.001,seconds)).toBe(stage-1);
        expect(narrationAt('A5',phrase,(seconds-.4)*1.7+.4)).toBeCloseTo(at*1.7);
      }
    }
    expect(lifecycleTxIndices).toEqual([[0,1],[2],[3],[4]]);
  });
  it('gives every X subtitle page at least two seconds with silent or measured VO clocks',()=>{
    for(const {scene,durationInFrames} of timeline('x')) {
      const seconds=durationInFrames/30;
      for(const speechSeconds of [seconds-.4,(seconds-.4)*.7,seconds*1.5]) {
        const effective=Math.max(seconds,speechSeconds+.4);
        const pages=subtitleSchedule(scene,effective,speechSeconds);
        expect(pages[0]!.start).toBe(0);
        expect(pages.at(-1)!.end).toBe(effective);
        pages.forEach((p,i)=>{
          expect(p.end-p.start).toBeGreaterThanOrEqual(2-1e-9);
          if(i)expect(p.start).toBe(pages[i-1]!.end);
        });
        // Sample every output frame, including at the adjusted clause boundaries.
        const counts=new Map<string,number>();
        for(let f=0;f<Math.round(effective*30);f++) {
          const text=textBand(scene,true,f/30,effective,speechSeconds);
          counts.set(text,(counts.get(text)??0)+1);
        }
        counts.forEach(count=>expect(count).toBeGreaterThanOrEqual(60));
      }
    }
    const a7=scenes.find(s=>s.id==='A7')!;
    const finalPages=subtitleCues(a7.voiceover);
    expect(finalPages.join(' ')).toBe(a7.voiceover);
    expect(finalPages.at(-1)).toBe('Run the local demo and check the testnet evidence yourself.');
    for(const seconds of [8,8.6,16]){
      expect(endCardRevealAt(seconds)).toBeLessThanOrEqual(.3);
      expect(seconds-endCardRevealAt(seconds)).toBeGreaterThanOrEqual(3);
    }
  });
  it('maps every spoken or silent-caption number to a literal CLAIMS anchor and a real evidence file',()=>{
    for(const scene of scenes){
      const covered:string[]=[];
      expect(scene.claims.length).toBeGreaterThan(0);
      for(const id of scene.claims){
        const mapping=data.claims[id as keyof typeof data.claims];
        expect(mapping,`${scene.id}/${id}`).toBeDefined();
        expect(claims,`${scene.id}/${id} claim anchor`).toContain(mapping.anchor);
        // Generated v3 verifier is checked in capture QA when present; fresh source
        // checkouts retain the documented evidence mapping without needing a browser.
        if(!mapping.evidence.startsWith('videos/')) expect(existsSync(path.join(root,mapping.evidence)),mapping.evidence).toBe(true);
        covered.push(...mapping.spoken.map(n=>n.toLowerCase()));
      }
      for(const n of numbers(subtitleText(scene)))expect(covered,`${scene.id}: untracked spoken number ${n}`).toContain(n.toLowerCase());
    }
  });
  it('has one diagram in each cut, proof hooks first, end cards last, and hard-crops Hypurrscan',()=>{
    for(const cut of ['x','judge'] as Cut[]){
      const rows=scenes.filter(s=>s.cut===cut);
      expect(rows[0]!.kind).toBe(cut==='x'?'proof':'footage');
      if(cut==='judge')expect(rows[0]!.shots[0]!.panels).toHaveLength(2);
      expect(rows.filter(s=>s.kind==='diagram')).toHaveLength(1);
      expect(rows.at(-1)!.kind).toBe('end');
      for(const scene of rows){
        if(['keeper','rogue'].includes(scene.kind))expect(scene.badge).toMatch(/LOCAL (SANDBOX|SIMULATION).*MOCKED/);
        for(const shot of scene.shots)for(const panel of shot.panels){
          if(panel.asset==='captures/hl-fills.png'){
            expect(panel.crop).toEqual([76,230,1768,337]);
            expect(panel.crop![1]).toBeGreaterThan(143); // RPC status box ends above table.
          }
          for(const key of panel.camera){expect(key.rect.every(Number.isFinite)).toBe(true);expect(key.rect[2]).toBeGreaterThan(0);}
        }
      }
    }
  });
  it('keeps authentic terminal excerpts ordered, without pipe spacers or missing rogue lines',()=>{
    const report=JSON.parse(read('reports/demo-local.json'));
    const rows=report.transcript.map((text:string,i:number)=>({number:i+1,text}));
    expect(terminalExcerpt(rows,false).map(r=>r.number)).toEqual([3,10,16,36,50]);
    const rogue=terminalExcerpt(rows,true);
    expect(rogue.filter(r=>r.text.startsWith('ROGUE '))).toHaveLength(7);
    expect(rogue.map(r=>r.number)).toEqual([37,38,39,40,41,44,45,46,49,51]);
    expect(rogue.at(-1)!.text).toMatch(/^PASS 7\/7/);
    const keeper=terminalExcerpt(rows,false);
    expect(keeper.find(r=>r.number===16)!.text).toContain('$2.8062');
    expect(keeper.find(r=>r.number===16)!.text).toContain('2.281');
    expect(keeper.some(r=>r.text.includes('$3.2299'))).toBe(false);
  });
  it('backs the v3 exit claim with named regressions and A4 arrival and live-run provenance',()=>{
    for(const name of ['exits_far_outside_opening_band_all_authorities_and_exact_slippage_cap','oracle_outside_band_can_close_but_cannot_open']){
      expect(claims).toContain(name);
      expect(read('contracts/policy/src/tests/v3.rs')).toContain('fn '+name+'(');
    }
    expect(claims).toContain('sandbox_v3_keyless_timelock_and_out_of_band_exits');
    expect(read('contracts/policy/tests/sandbox.rs')).toContain('async fn sandbox_v3_keyless_timelock_and_out_of_band_exits(');
    expect(claims).toContain('POLICY-V3.md#protective-exits');
    const evidence=read('apps/video/src/XEvidence.tsx');
    expect(evidence).toContain('docs/evidence/2026-11-13-v2-arrival-arbitrum-sepolia.json');
    expect(evidence).toContain('docs/evidence/2026-11-12-v3-lifecycle-summary.md');
    const a4=scenes.find(s=>s.id==='A4')!;
    expect(a4.shots).toHaveLength(1);
    expect(a4.shots[0]!.panels[0]).toMatchObject({asset:'captures/hl-fills.png',crop:[76,230,1768,337]});
    expect(a4.claims).toEqual(['withdraw','versions','a4Arrival','a4LiveV3']);
  });
  it('inserts dated mainnet proof after A4 while keeping the earlier evidence clearly historical',()=>{
    const x=scenes.filter(s=>s.cut==='x');
    expect(x.map(s=>s.id)).toEqual(['A1','A2','A3','A4','A4M','A5','A6','A7']);
    expect(x.filter(s=>s.voiceover).map(s=>String(s.number).padStart(2,'0')+'.mp3')).toEqual(['01.mp3','02.mp3','03.mp3','04.mp3','05.mp3','06.mp3','07.mp3']);
    expect(x[0]!.badge.toLowerCase()).toContain('testnet history + mainnet 14 nov');
    for(const id of ['A2','A3','A4','A5','A6'])expect(x.find(s=>s.id===id)!.badge.toLowerCase(),id).toContain('testnet');
    const mainnet=x.find(s=>s.id==='A4M')!;
    expect(mainnet).toMatchObject({start:43,end:50,seconds:7,number:'04-mainnet',voiceover:''});
    expect(mainnet.badge.toLowerCase()).toContain('mainnet');
    const summary=JSON.parse(read('docs/evidence/2026-11-14-v4-mainnet-lifecycle-summary.json'));
    expect(summary.policy).toMatchObject({account:'cw4.haxheton.near',key_count:0});
    const step=(name:string)=>summary.steps.find((row:any)=>row.step===name);
    expect(step('Deposit spot custody').amount).toBe('3.6 wNEAR');
    expect(step('Open short')).toMatchObject({amount:'Sell 3.6 NEAR @ 3.3241',venue_hash:'0xa768851a0c51f57aa8e20448c6ec5002045500ffa755144c4b31306ccb55cf65'});
    expect(step('Reduce-only close')).toMatchObject({amount:'Buy 3.6 NEAR @ 3.3248',venue_hash:'0x2fad11edb3ade83731260448c6f1560201f400d34ea10709d375bd4072a1c221'});
    expect(step('withdraw3 signature and relay').amount).toBe('18.886709 USDC gross');
    expect(step('Arbitrum One native USDC arrival')).toMatchObject({amount:'17.886709 USDC received; 1 USDC bridge fee',venue_hash:'0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d'});
    expect(step('Return spot').amount).toBe('3.6 wNEAR to haxheton.near');
    expect(step('Final live status').amount).toContain('flat; no open orders; policy spot=0');
    expect(mainnetProofRows).toEqual([
      {label:'KEYLESS POLICY',value:`${summary.policy.account} · ${summary.policy.key_count} keys`,detail:`${step('Deposit spot custody').amount} custody`},
      {label:'OPEN SHORT',value:step('Open short').amount.replace('Sell ',''),detail:`HL ${step('Open short').venue_hash.slice(0,10)}…`},
      {label:'REDUCE-ONLY CLOSE',value:step('Reduce-only close').amount.replace('Buy ','').replace(' NEAR',''),detail:`HL ${step('Reduce-only close').venue_hash.slice(0,10)}…`},
      {label:'ARBITRUM ONE',value:'17.886709 native USDC',detail:`${step('Arbitrum One native USDC arrival').venue_hash.slice(0,10)}…`},
    ]);
    const picture=read('apps/video/src/XEvidence.tsx');
    for(const value of ['MAINNET · 14 Nov 2026 · policy v4','withdraw3 · spot returned · flat','owner-supervised · one lifecycle · unaudited','docs/evidence/2026-11-14-v4-mainnet-lifecycle-summary.md'])expect(picture).toContain(value);
    const film=read('apps/video/src/Film.tsx');
    expect(film).toContain('https://saylool.github.io/counterweight/');
    expect(film).toContain('npm run verify:mainnet');
    expect(x.at(-1)!.voiceover).toContain('testnet prototype');
  });
  it('keeps the proof card silent for seven seconds and pages its exact caption in subtitle style',()=>{
    const mainnet=scenes.find(s=>s.id==='A4M')!;
    expect(mainnet.voiceover).toBe('');
    expect(mainnet.caption).toBe('On mainnet, keyless policy v4 held 3.6 wNEAR, opened and closed a real Hyperliquid short, and 17.886709 USDC arrived on Arbitrum One.');
    const pages=subtitleCues(mainnet.caption);
    expect(pages).toHaveLength(3);
    expect(pages.join(' ')).toBe(mainnet.caption);
    for(const measured of [5,8,13.2,18,24]){
      // A stale supplied audio entry must never turn the intentional silent card into narration.
      const audio={A4M:{src:'vo/x/04-mainnet.mp3',seconds:measured}};
      const rows=timeline('x',audio);
      const index=rows.findIndex(row=>row.scene.id==='A4M');
      const row=rows[index]!;
      expect(row.durationInFrames).toBe(210);
      expect(row.from).toBe(rows[index-1]!.from+rows[index-1]!.durationInFrames);
      expect(rows[index+1]!.from).toBe(row.from+row.durationInFrames);
      const schedule=subtitleSchedule(mainnet,7,measured);
      schedule.forEach((page,i)=>{
        expect(page.end-page.start).toBeGreaterThanOrEqual(2);
        if(i)expect(page.start).toBe(schedule[i-1]!.end);
        for(const subtitles of [false,true])expect(textBand(mainnet,subtitles,(page.start+page.end)/2,7,measured)).toBe(page.text);
      });
      expect(schedule.at(-1)!.end).toBe(7);
    }
    const film=read('apps/video/src/Film.tsx'),renderer=read('scripts/video/remotion.ts');
    expect(film).toContain("const subtitleStyle=Boolean(props.subtitles)||!scene.voiceover;");
    expect(film).toContain("scene.voiceover&&props.audio[scene.id]&&<Audio");
    expect(renderer).toContain("scenes.filter(s=>s.cut===cut && s.voiceover)");
    expect(renderer).not.toContain("sine=frequency");
    expect(renderer).not.toContain("tick.wav");
    expect(film).not.toContain("tick.wav");
  });
  it('checks narrated replay quantities against the committed report fields',()=>{
    const report=JSON.parse(read('reports/replay-report.json'));
    const row=(period:string,policy:string,label='illustrative')=>{
      const matches=report.comparisons.filter((r:any)=>r.period===period&&r.policy===policy&&r.label===label);
      expect(matches).toHaveLength(1);return matches[0];
    };
    const full=row('full','hedged-rebalance'), holdout=row('holdout','hedged-rebalance'), always=row('full','always-hedged'), spot=row('full','spot-holder'), small=row('full','hedged-rebalance','demo');
    const vo=scenes.find(s=>s.id==='B8')!.voiceover;
    for(const value of [report.provenance.completeHours.toLocaleString('en-US'),'$'+full.netPnlUsd.toFixed(2),full.netReturnPct.toFixed(2)+'%',always.maintenanceProxyBreachHours.toLocaleString('en-US'),holdout.netReturnPct.toFixed(2)+'%']){
      expect(vo).toContain(value);expect(claims).toContain(value);
    }
    expect(full.maintenanceProxyBreachHours).toBe(0);
    expect(always.minMarkedVenueEquityUsd).toBeLessThan(0);
    expect(spot.initialCapitalUsd).toBeLessThan(full.initialCapitalUsd);
    expect(small.netPnlUsd).toBeLessThan(0);
  });
  it('checks local rally, attack count, owner freeze and recovery against actual saved evidence',()=>{
    const report=JSON.parse(read('reports/demo-local.json'));
    expect(report.status).toBe('passed');expect(report.offlineGuardActive).toBe(true);
    expect(report.selection.perpMovePct.toFixed(1)).toBe('32.5');
    expect(report.selection.perpMovePct.toFixed(6)).toBe('32.499065');
    expect(report.selection.hours).toBe(24);
    expect(report.rogueAttempts.filter((a:any)=>a.rejected)).toHaveLength(7);
    expect(report.ownerAfter).toEqual(report.ownerBefore);
    expect(report.assertions.policyHasNoKeys).toBe(true);
    expect(report.assertions.earlyDeadmanRejected).toBe(true);
    expect(report.assertions.unrelatedDeadmanSigned).toBe(true);
    expect(report.transcript.some((s:string)=>s.includes('DEAD-MAN +601s'))).toBe(true);
    expect(report.transcript.some((s:string)=>s.startsWith('PASS 7/7'))).toBe(true);
  });

  it('locks the seven unchanged recorded voiceovers and keeps protected phrases on one subtitle page',()=>{
    const final={
      "A1": "Counterweight hedges NEAR holdings with a short, and a keyless NEAR policy limits what the keeper can sign. Recorded on Hyperliquid testnet.",
      "A2": "Counterweight puts a keyless NEAR policy contract between the keeper and the exchange. The keeper proposes an order, the contract checks its bounds, and NEAR Chain Signatures sign it for Hyperliquid.",
      "A3": "The owner funded the account, then deleted the policy's access keys. The keeper opened a 3.5 NEAR short and closed it reduce-only. The position is flat.",
      "A4": "The v2 run withdrew nearly forty-seven USDC net, and it arrived. On November twelfth, a separate keyless v3 opened and closed a live testnet short.",
      "A5": "In a local simulation with the real policy WASM and mocked signatures, NEAR rallied thirty-two and a half percent in a day. The keeper closed the hedge reduce-only, and the owner's nonce and balance stayed unchanged.",
      "A6": "Seven tested unauthorized requests, from oversized shorts to rogue withdrawals, were all rejected. After a timeout, the policy allows recovery; that signature was mocked.",
      "A7": "Counterweight is a supervised testnet prototype, built at NEAR HACKATHON. Run the local demo and check the testnet evidence yourself."
};
    for(const [id,vo] of Object.entries(final))expect(scenes.find(s=>s.id===id)!.voiceover).toBe(vo);
    expect(scenes.filter(s=>!s.voiceover).map(s=>s.id)).toEqual(['A4M']);
    expect(subtitleCues(final.A1)).toEqual([
      "Counterweight hedges NEAR holdings with a short,",
      "and a keyless NEAR policy limits what the keeper can sign.",
      "Recorded on Hyperliquid testnet.",
    ]);
    expect(subtitleCues(final.A7)).toEqual([
      "Counterweight is a supervised testnet prototype, built at NEAR HACKATHON.",
      "Run the local demo and check the testnet evidence yourself.",
    ]);
    for(const phrase of ["what the keeper can sign","policy's access keys","NEAR HACKATHON","Arbitrum One"]){
      for(const scene of scenes.filter(s=>s.cut==='x'&&subtitleText(s).includes(phrase)))expect(subtitleCues(subtitleText(scene)).some(c=>c.includes(phrase))).toBe(true);
    }
  });
  it('advances architecture once and switches the full-width v3 beat at On November twelfth',()=>{
    const seconds=13;
    const stages=Array.from({length:seconds*30},(_,f)=>architectureStage(f/30,seconds));
    expect([...new Set(stages)]).toEqual([0,1,2,3]);
    expect(stages.every((s,i)=>i===0||s>=stages[i-1]!)).toBe(true);
    expect(architectureStage(narrationAt('A2','The keeper proposes',seconds),seconds)).toBe(1);
    expect(architectureStage(narrationAt('A2','the contract checks',seconds),seconds)).toBe(2);
    expect(architectureStage(narrationAt('A2','and NEAR Chain',seconds),seconds)).toBe(3);
    const at=narrationAt('A4','On November twelfth,',seconds);
    const a4=scenes.find(s=>s.id==='A4')!;
    expect(textBand(a4,true,at-.001,seconds)).toBe('The v2 run withdrew nearly forty-seven USDC net, and it arrived.');
    expect(textBand(a4,true,at+.001,seconds)).toBe('On November twelfth, a separate keyless v3 opened and closed a live testnet short.');
  });
  it('shows authentic verification fills and flat with provenance',()=>{
    const records=JSON.parse(read('apps/video/src/recorded-fills.json'));
    for(const record of Object.values(records) as any[])expect(record.verification).toEqual(JSON.parse(read(record.source)).verification);
    expect(records.open.verification.fills[0]).toMatchObject({sz:'3.5',px:'3.5121'});
    expect(records.close.verification.fills[0]).toMatchObject({sz:'3.5',px:'3.5212'});
    expect(records.close.verification.flat).toBe(true);
  });
  it('counts seven rejects but highlights only the two spoken examples and recovery',()=>{
    const report=JSON.parse(read('reports/demo-local.json'));
    const rows=terminalExcerpt(report.transcript.map((text:string,i:number)=>({number:i+1,text})),true);
    expect(rows.filter(row=>terminalTone(row.text)==='reject')).toHaveLength(7);
    expect(terminalTone(rows.find(r=>r.number===46)!.text)).toBe('timelock');
    const focus=Array.from({length:450},(_,f)=>rogueFocus(f/30,15));
    expect([...new Set(focus)]).toEqual([null,37,39,49]);
    expect(rogueFocus(narrationAt('A6','oversized shorts',15),15)).toBe(37);
    expect(rogueFocus(narrationAt('A6','rogue withdrawals',15),15)).toBe(39);
    expect(rogueFocus(narrationAt('A6','were all rejected',15),15)).toBeNull();
    expect(rogueFocus(narrationAt('A6','After a timeout',15),15)).toBe(49);
  });
  it('matches the CLAIMS rally row close time, price and headroom to the first report close',()=>{
    const report=JSON.parse(read('reports/demo-local.json'));
    const close=report.timeline.find((t:any)=>t.action==='reduce-only close');
    expect(close).toBeDefined();
    const row=claims.split('\n').find(line=>line.startsWith('| Worst rolling 24h rally '));
    expect(row).toBeDefined();
    const match=row!.match(/close at (\d{2}-\d{2} \d{2}:\d{2}) UTC, NEAR \$(\d+\.\d+), H (\d+\.\d+)/);
    expect(match).not.toBeNull();
    expect(match!.slice(1)).toEqual([
      new Date(close.time).toISOString().slice(5,16).replace('T',' '),
      close.nearPrice.toFixed(4),close.headroomUsd.toFixed(3),
    ]);
    expect(row).toContain(`+${report.selection.perpMovePct.toFixed(6)}%`);
    expect(row).toContain(`${report.selection.candidates} candidates`);
  });
});
