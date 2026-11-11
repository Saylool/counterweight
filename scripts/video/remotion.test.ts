import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import data from '../../apps/video/src/scenes.json' with {type:'json'};
import {scenes, timeline, totalFrames, wordCount, type Cut} from '../../apps/video/src/model.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=(file:string)=>readFileSync(path.join(root,file),'utf8');
const script=read('apps/video/production-script.md');
const claims=read('docs/CLAIMS.md');
const parse=(text:string)=>text.split('\n').filter(line=>/^\| \*\*[AB]\d+\./.test(line)).map(line=>{
  let code=false,part='';const c:string[]=[];
  for(const char of line.replace(/^\||\|$/g,'')){
    if(char==='`')code=!code;
    if(char==='|'&&!code){c.push(part.trim());part='';}else part+=char;
  }
  c.push(part.trim());
  const [start,end]=c[1]!.match(/\d+/g)!.map(Number);
  return {id:c[0]!.match(/\*\*([AB]\d+)\./)![1]!,start,end,visual:c[2],voiceover:c[3],caption:c[4]!.replace(/^\*\*|\*\*$/g,'')};
});
// Long phrases first, then all remaining numeric tokens (including identifiers).
// English cardinals cover future prose additions; any unmapped expression fails.
const numbers=(text:string)=>text.match(/forty-six point nine-six|twenty-four-hour|thirty-two|forty-nine|November tenth|\b(?:policy-)?v\d+(?:\.signer)?\b|\$?\b\d[\d,]*(?:\.\d+)?%?|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|tenth)\b/gi)??[];

describe('Remotion production tables and evidence',()=>{
  it('matches every script row, timing, caption, voiceover and visual direction verbatim',()=>{
    const expected=parse(script);
    expect(scenes).toHaveLength(17);
    expect(scenes.map(({id,start,end,visual,voiceover,caption})=>({id,start,end,visual,voiceover,caption}))).toEqual(expected);
    if(process.env.VIDEO_PRODUCTION_SCRIPT)expect(parse(readFileSync(process.env.VIDEO_PRODUCTION_SCRIPT,'utf8'))).toEqual(expected);
    for(const cut of ['x','judge'] as Cut[]){
      const rows=timeline(cut);
      expect(totalFrames(cut)).toBe((cut==='x'?75:165)*30);
      rows.forEach((row,i)=>{
        expect(row.from).toBe(row.scene.start*30);
        expect(row.durationInFrames).toBe((row.scene.end-row.scene.start)*30);
        expect(row.scene.seconds).toBe(row.scene.end-row.scene.start);
        expect(row.from).toBe(i?rows[i-1]!.from+rows[i-1]!.durationInFrames:0);
        expect(wordCount(row.scene.caption),row.scene.id).toBeLessThanOrEqual(8);
      });
    }
  });
  it('extends short scenes for audio plus 0.4 seconds and ripples subsequent starts, rounded up to a frame',()=>{
    const audio={A1:{src:'vo/x/01.mp3',seconds:6.013},A2:{src:'vo/x/02.mp3',seconds:2}};
    const rows=timeline('x',audio);
    expect(rows[0]!.durationInFrames).toBe(Math.ceil(6.413*30));
    expect(rows[1]!.durationInFrames).toBe(14*30);
    expect(rows[1]!.from).toBe(rows[0]!.durationInFrames);
    expect(totalFrames('x',audio)).toBe(2250-150+Math.ceil(6.413*30));
    expect(totalFrames('judge',{})).toBe(4950);
  });
  it('maps every spoken number to a literal CLAIMS anchor and a real evidence file',()=>{
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
      for(const n of numbers(scene.voiceover))expect(covered,`${scene.id}: untracked spoken number ${n}`).toContain(n.toLowerCase());
    }
  });
  it('has one diagram in each cut, proof hooks first, end cards last, and hard-crops Hypurrscan',()=>{
    for(const cut of ['x','judge'] as Cut[]){
      const rows=scenes.filter(s=>s.cut===cut);
      expect(rows[0]!.kind).toBe('footage');
      expect(rows[0]!.shots[0]!.panels).toHaveLength(2);
      expect(rows.filter(s=>s.kind==='diagram')).toHaveLength(1);
      expect(rows.at(-1)!.kind).toBe('end');
      for(const scene of rows){
        if(['keeper','rogue'].includes(scene.kind))expect(scene.badge).toMatch(/LOCAL SANDBOX.*MOCKED/);
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
    // Do not replace authentic footage with the production directions' stale close.
    const close=report.timeline.find((t:any)=>t.action==='reduce-only close');
    expect(claims).toContain(close.nearPrice.toFixed(4));
    expect(claims).toContain(close.headroomUsd.toFixed(3));
  });
});
