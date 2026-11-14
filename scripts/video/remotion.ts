/** Offline edit/render only: no keys, sandbox execution, explorer reads or chain sends. */
import {existsSync} from 'node:fs';
import {copyFile, mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {placeholder, scenes, timeline, type Cut, type VideoProps} from '../../apps/video/src/model.js';
import {ROOT, isMain, run} from './common.js';
import {transcript} from './terminal.js';

const app=path.join(ROOT,'apps/video');
const build=path.join(app,'build');
export async function probeAudio(file:string) {
  const result=JSON.parse(await run('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_type:format=duration','-of','json',file],{capture:true})) as {streams:unknown[];format:{duration:string}};
  const seconds=Number(result.format.duration);
  if(!result.streams.length||!Number.isFinite(seconds)||seconds<=0) throw new Error(`Invalid voiceover audio: ${file}`);
  return seconds;
}
export async function browserExecutable():Promise<string|null> {
  if(process.env.REMOTION_BROWSER_EXECUTABLE) return process.env.REMOTION_BROWSER_EXECUTABLE;
  const base=path.join(ROOT,'videos/build/browsers');
  const dirs=existsSync(base)?await readdir(base):[];
  for(const dir of dirs.filter(d=>d.startsWith('chromium_headless_shell-')).sort().reverse()) {
    for(const suffix of ['chrome-headless-shell-mac-arm64/chrome-headless-shell','chrome-headless-shell-mac-x64/chrome-headless-shell','chrome-headless-shell-linux64/chrome-headless-shell']) {
      const candidate=path.join(base,dir,suffix);if(existsSync(candidate))return candidate;
    }
  }
  return null; // Remotion's regular browser discovery/download, no remote service.
}
export async function prepare(cut:Cut, subtitles=false) {
  await mkdir(build,{recursive:true});
  const publicDir=path.join(app,'public');
  const manifest=JSON.parse(await readFile(path.join(ROOT,'videos/build/captures/manifest.json'),'utf8')) as {records:{shot:string;state:string}[]};
  const assetNames=[...new Set(scenes.filter(s=>s.cut===cut).flatMap(s=>s.shots.flatMap(shot=>shot.panels.map(p=>p.asset))))];
  const assets:Record<string,string>={};
  for(const asset of assetNames) {
    const record=manifest.records.find(r=>`${r.shot}.png`===path.basename(asset));
    if(!record||record.state!=='captured')throw new Error(`Missing/failed real capture ${asset}. Lead: npm run video:capture`);
    const from=path.join(ROOT,'videos/build',asset),to=path.join(publicDir,asset);
    if(!existsSync(from))throw new Error(`Missing ${from}. Lead: npm run video:capture`);
    await mkdir(path.dirname(to),{recursive:true});await copyFile(from,to);
    assets[asset]=createHash('sha256').update(await readFile(from)).digest('hex');
  }
  // Keep the rendered source excerpts byte-for-field aligned with saved evidence.
  if(cut==='x') {
    const excerpts=JSON.parse(await readFile(path.join(app,'src/recorded-fills.json'),'utf8')) as Record<string,{source:string;verification:unknown}>;
    for(const record of Object.values(excerpts)) {
      const rawEvidence=await readFile(path.join(ROOT,record.source),'utf8');
      const saved=JSON.parse(rawEvidence) as {verification:unknown};
      if(JSON.stringify(saved.verification)!==JSON.stringify(record.verification))throw new Error(`Stale video excerpt: ${record.source}`);
      assets[record.source]=createHash('sha256').update(rawEvidence).digest('hex');
    }
  }
  const raw=await readFile(path.join(ROOT,'reports/demo-local.json'),'utf8');
  const terminal=transcript(raw).map((text,i)=>({number:i+1,text}));
  const audio:VideoProps['audio']={};
  for(const scene of scenes.filter(s=>s.cut===cut && s.voiceover)) {
    const name=String(scene.number).padStart(2,'0')+'.mp3';
    const from=path.join(ROOT,'videos/vo',cut,name);
    if(!existsSync(from))continue;
    const seconds=await probeAudio(from),src=`vo/${cut}/${name}`;
    await mkdir(path.join(publicDir,'vo',cut),{recursive:true});await copyFile(from,path.join(publicDir,src));
    audio[scene.id]={seconds,src};
    assets[src]=createHash('sha256').update(await readFile(from)).digest('hex');
  }
  let repoUrl=process.env.VIDEO_REPO_URL?.trim()||(cut==='x'?'https://github.com/Saylool/counterweight':placeholder);
  if(repoUrl!==placeholder) {
    if(!/^https?:\/\//.test(repoUrl))repoUrl='https://'+repoUrl;
    const parsed=new URL(repoUrl);
    if(parsed.username||parsed.password)throw new Error('VIDEO_REPO_URL must be a public URL without credentials.');
    repoUrl=parsed.href.replace(/\/$/,'');
  }
  const props:VideoProps={cut,repoUrl,audio,terminal,subtitles};
  await writeFile(path.join(build,`${cut}-props.json`),JSON.stringify(props,null,2)+'\n');
  await writeFile(path.join(build,`${cut}-timeline.json`),JSON.stringify({cut,repoUrl,fps:30,assets,terminalSource:'reports/demo-local.json',terminalSha256:createHash('sha256').update(raw).digest('hex'),scenes:timeline(cut,audio).map(({scene,from,durationInFrames})=>({id:scene.id,caption:scene.caption,scriptSeconds:scene.seconds,from,durationInFrames,audio:audio[scene.id]??null})),silentScenes:scenes.filter(s=>s.cut===cut&&!audio[s.id]).map(s=>s.id)},null,2)+'\n');
  return {props,publicDir};
}
export async function main() {
  const args=process.argv.slice(2), cutArg=args.find(a=>a.startsWith('--cut='))?.slice(6)??'x';
  if(cutArg!=='x'&&cutArg!=='judge')throw new Error('Use --cut=x or --cut=judge');
  const cut:Cut=cutArg;
  for(const arg of args)if(!/^(--cut=(x|judge)|--subtitles|--preview|--stills|--bundle-only|--frames=\d+-\d+|--scale=(0\.5|1)|--concurrency=\d+)$/.test(arg))throw new Error(`Unknown option: ${arg}`);
  const {props,publicDir}=await prepare(cut,args.includes('--subtitles'));
  const id=cut==='x'?'XCut':'JudgeCut';
  const total=timeline(cut,props.audio).reduce((n,row)=>n+row.durationInFrames,0);
  console.log(`${id}: ${total} frames / ${(total/30).toFixed(2)}s; ${Object.keys(props.audio).length} voiceover files. Missing scenes play silently.`);
  if(props.repoUrl===placeholder)console.warn('Review placeholder on end card: set VIDEO_REPO_URL before publishing.');
  if(args.includes('--preview')) {
    // Prepare only the requested cut. Judge remains archived, not a deliverable.
    const previewProps=props;
    const file=path.join(build,'studio-props.json');await writeFile(file,JSON.stringify(previewProps));
    const child=spawn(process.execPath,[path.join(ROOT,'node_modules/@remotion/cli/remotion-cli.js'),'studio',path.join(app,'src/index.tsx'),'--public-dir',publicDir,'--props',file,'--port','3333','--no-open','--disable-git-source','--webpack-poll=1000'],{cwd:app,env:{...process.env,CHOKIDAR_USEPOLLING:'true',WATCHPACK_POLLING:'1000'},stdio:'inherit'});
    const code=await new Promise<number>((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code??1));});
    if(code)throw new Error(`Studio exited ${code}`);return;
  }
  const serveUrl=await bundle({entryPoint:path.join(app,'src/index.tsx'),publicDir,outDir:path.join(build,'bundle')});
  if(args.includes('--bundle-only')){console.log(`Built ${serveUrl}`);return;}
  const executable=await browserExecutable();
  const browser={browserExecutable:executable,chromiumOptions:{enableMultiProcessOnLinux:true}};
  const composition=await selectComposition({serveUrl,id,inputProps:props,...browser});
  const scale=Number(args.find(a=>a.startsWith('--scale='))?.slice(8)??1);
  if(args.includes('--stills')) {
    const dir=path.join(build,'stills',cut);await mkdir(dir,{recursive:true});
    for(const row of timeline(cut,props.audio)) {
      const seconds=row.durationInFrames/30;
      const offsets=cut==='x'?[0.5, ...[.2,.45,.7,.95].map(p=>seconds*p)]:row.scene.kind==='diagram'?[1,3.6,5.3,7.9,11.6,17.8]:[Math.max(1,seconds-2)];
      for(const offset of offsets) {
        const frame=row.from+Math.min(row.durationInFrames-1,Math.round(offset*30));
        const output=path.join(dir,`${row.scene.id}-${Math.round(offset*10)}.png`);
        await renderStill({serveUrl,composition,inputProps:props,frame,output,...browser,scale});
        console.log(output);
      }
    }
    return;
  }
  const range=args.find(a=>a.startsWith('--frames='))?.slice(9).split('-').map(Number);
  if(range&&(range.length!==2||range[0]!>range[1]!||range[1]!>=total))throw new Error(`Frame range must be ordered within 0–${total-1}`);
  const sample=Boolean(range)||scale!==1;
  const outputLocation=path.join(cut==='x'?build:path.join(ROOT,'videos'),`counterweight-${cut}-${cut==='x'?'v3':'v2'}${props.subtitles?'-subtitles':''}${sample?'-sample':''}.mp4`);
  let last=-1;
  await renderMedia({serveUrl,composition,inputProps:props,outputLocation,codec:'h264',audioCodec:'aac',pixelFormat:'yuv420p',crf:18,
    concurrency:Number(args.find(a=>a.startsWith('--concurrency='))?.slice(14)??2),
    ...(range?{frameRange:[range[0]!,range[1]!] as [number,number]}:{}),scale,...browser,
    onProgress:({progress})=>{const pct=Math.floor(progress*10)*10;if(pct!==last){last=pct;console.log(`Render ${pct}%`);}},
  });
  const probe=JSON.parse(await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',outputLocation],{capture:true})) as {streams:{codec_type:string;codec_name:string;width:number;height:number;r_frame_rate:string}[];format:{duration:string}};
  const video=probe.streams.find(s=>s.codec_type==='video');
  if(video?.codec_name!=='h264'||video.width!==1920*scale||video.height!==1080*scale||video.r_frame_rate!=='30/1')throw new Error('Output video format verification failed.');
  const expected=(range?range[1]!-range[0]!+1:total)/30;
  if(Math.abs(Number(probe.format.duration)-expected)>.1)throw new Error('Output duration verification failed.');
  if(Object.keys(props.audio).length&&!range&&!probe.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'))throw new Error('Expected AAC voiceover track.');
  await writeFile(path.join(build,`${cut}${sample?'-sample':''}-render.json`),JSON.stringify({outputLocation,probe},null,2));
  console.log(`Verified ${outputLocation}`);
}
if(isMain(import.meta.url))main().catch(error=>{console.error(error);console.error('Render: npm run video:remotion -- --cut=x --subtitles. For a custom Chromium: REMOTION_BROWSER_EXECUTABLE=/absolute/path/to/chrome');process.exitCode=1;});
