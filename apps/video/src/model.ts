import data from './scenes.json' with {type:'json'};
export const FPS = data.fps;
export type Cut = 'x' | 'judge';
export type Rect = [number, number, number, number];
export type Panel = {asset: string; box: Rect; label: string; crop?: Rect; camera: {at: number; rect: Rect}[]};
export type Scene = Omit<typeof data.scenes[number], 'shots'> & {shots: {at: number; panels: Panel[]}[]};
export const scenes = data.scenes as Scene[];
export type AudioInfo = {src: string; seconds: number};
export type VideoProps = {
  cut: Cut; repoUrl: string; audio: Record<string, AudioInfo>;
  terminal: {number: number; text: string}[];
  subtitles?: boolean;
};
export const placeholder = '[PUBLIC REPOSITORY URL — SET VIDEO_REPO_URL]';
export const wordCount = (text: string) => text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
export const hookHeadline = 'Automate a NEAR hedge. Limit what the keeper can sign.';
export const keeperRevealOrder = [3, 10, 16, 36, 50];
export const textBand = (scene: Scene, subtitles: boolean, elapsed: number, seconds: number, speechSeconds = seconds - .4) => {
  if (!subtitles && scene.voiceover) return scene.caption;
  const cues = subtitleSchedule(scene, seconds, speechSeconds);
  return cues.find(cue => elapsed < cue.end)?.text ?? cues.at(-1)!.text;
};
export function timeline(cut: Cut, audio: VideoProps['audio'] = {}) {
  let from = 0;
  return scenes.filter(scene => scene.cut === cut).map(scene => {
    const entry = scene.voiceover ? audio[scene.id] : undefined;
    const durationInFrames = Math.ceil((scene.voiceover ? Math.max(scene.seconds, entry ? entry.seconds + 0.4 : wordCount(scene.voiceover) / 2.5 + 0.6) : scene.seconds) * FPS);
    const row = {scene, from, durationInFrames};
    from += durationInFrames;
    return row;
  });
}
export const totalFrames = (cut: Cut, audio: VideoProps['audio'] = {}) => timeline(cut, audio).reduce((sum, row) => sum + row.durationInFrames, 0);

// Editorial clause boundaries, approved for the final X narration. Exact words are retained.
export const xSubtitlePages: Record<string, string[]> = {
  A1: ["Counterweight hedges NEAR holdings with a short,", "and a keyless NEAR policy limits what the keeper can sign.", "Recorded on Hyperliquid testnet."],
  A2: ["Counterweight puts a keyless NEAR policy contract between the keeper and the exchange.", "The keeper proposes an order,", "the contract checks its bounds,", "and NEAR Chain Signatures sign it for Hyperliquid."],
  A3: ["The owner funded the account,", "then deleted the policy's access keys.", "The keeper opened a 3.5 NEAR short", "and closed it reduce-only. The position is flat."],
  A4: ["The v2 run withdrew nearly forty-seven USDC net, and it arrived.", "On November twelfth, a separate keyless v3 opened and closed a live testnet short."],
  A4M: ["On mainnet, keyless policy v4 held 3.6 wNEAR,", "opened and closed a real Hyperliquid short,", "and 17.886709 USDC arrived on Arbitrum One."],
  A5: ["In a local simulation with the real policy WASM and mocked signatures,", "NEAR rallied thirty-two and a half percent in a day.", "The keeper closed the hedge reduce-only,", "and the owner's nonce and balance stayed unchanged."],
  A6: ["Seven tested unauthorized requests,", "from oversized shorts to rogue withdrawals, were all rejected.", "After a timeout, the policy allows recovery; that signature was mocked."],
  A7: ["Counterweight is a supervised testnet prototype, built at NEAR HACKATHON.", "Run the local demo and check the testnet evidence yourself."],
};
// An empty voiceover marks an intentionally silent visual card; its caption is paged instead.
export const subtitleText = (scene: Scene) => scene.voiceover || scene.caption;
export function subtitleCues(text: string) {
  const scene = scenes.find(s => s.cut === 'x' && subtitleText(s) === text);
  if (scene) return xSubtitlePages[scene.id]!;
  // Archived Judge uses sentence/clause boundaries, then bounded word groups.
  return text.split(/(?<=[,;.!?])\s+/).flatMap(clause => {
    const words = clause.trim().split(/\s+/);
    return Array.from({length: Math.ceil(words.length / 10)}, (_, i) => words.slice(i * 10, i * 10 + 10).join(' '));
  });
}
// Word positions are the shared clock. Callers supply the measured VO duration
// plus its .4s tail when audio exists, even if the scene's minimum slot is longer.
export function narrationAt(id: string, phrase: string, seconds: number) {
  const text = scenes.find(s => s.id === id)!.voiceover;
  const index = text.indexOf(phrase);
  if (index < 0) throw new Error(`Missing narration beat ${id}: ${phrase}`);
  return wordCount(text.slice(0, index)) / wordCount(text) * Math.max(0, seconds - .4);
}
export function subtitleSchedule(scene: Scene, seconds: number, speechSeconds = seconds - .4) {
  const text = subtitleText(scene);
  const pages = subtitleCues(text);
  const minimum = scene.cut === 'x' ? 2 : 0;
  if (seconds < pages.length * minimum) throw new Error(`Scene ${scene.id} cannot fit readable subtitle pages`);
  let words = 0;
  const boundaries = [0, ...pages.slice(0, -1).map(page => {
    words += wordCount(page);
    return words / wordCount(text) * (scene.voiceover ? speechSeconds : seconds);
  }), seconds];
  // Keep natural word boundaries where possible. Borrow time from adjacent pages
  // for short clauses, without leaving a last-page caveat to flash at the end.
  for (let i = boundaries.length - 2; i > 0; i--) boundaries[i] = Math.min(boundaries[i]!, boundaries[i + 1]! - minimum);
  for (let i = 1; i < boundaries.length - 1; i++) boundaries[i] = Math.max(boundaries[i]!, boundaries[i - 1]! + minimum);
  return pages.map((text, i) => ({text, start: boundaries[i]!, end: boundaries[i + 1]!}));
}
export const hookBeatTimes = (seconds: number) => ['hedges', 'keyless NEAR policy', 'Recorded on'].map(phrase => narrationAt('A1', phrase, seconds));
export const endCardRevealAt = (seconds: number) => Math.min(.3, narrationAt('A7', 'is a supervised', seconds));
export function architectureStage(elapsed: number, seconds: number) {
  return elapsed >= narrationAt('A2', 'and NEAR Chain', seconds) ? 3
    : elapsed >= narrationAt('A2', 'the contract checks', seconds) ? 2
    : elapsed >= narrationAt('A2', 'The keeper proposes', seconds) ? 1 : 0;
}
export const architectureHeadlines = [
  'Keyless policy contract between keeper and exchange',
  'Keeper proposes an order',
  'Policy contract checks bounds',
  'NEAR Chain Signatures sign for Hyperliquid',
];
export function keeperStage(elapsed: number, seconds: number) {
  return elapsed >= narrationAt('A5', "and the owner's", seconds) ? 3
    : elapsed >= narrationAt('A5', 'The keeper closed', seconds) ? 2
    : elapsed >= narrationAt('A5', 'NEAR rallied', seconds) ? 1 : 0;
}
export function rogueFocus(elapsed: number, seconds: number) {
  if (elapsed >= narrationAt('A6', 'After a timeout', seconds)) return 49;
  if (elapsed >= narrationAt('A6', 'were all rejected', seconds)) return null;
  if (elapsed >= narrationAt('A6', 'rogue withdrawals', seconds)) return 39;
  if (elapsed >= narrationAt('A6', 'oversized shorts', seconds)) return 37;
  return null;
}
export const lifecycleTxIndices = [[0, 1], [2], [3], [4]];
export const lifecycleSummaries = [
  'VERIFIED · 4 wNEAR deposited · 49 USDC transferred spot → perp',
  'VERIFIED · 0 access keys at keeper receipt blocks · committed v2 WASM matched',
];
export const terminalTone = (text: string) => text.startsWith('DEAD-MAN before') ? 'timelock'
  : text.startsWith('ROGUE ') && text.includes('REJECT') ? 'reject'
  : /PASS|SIGNED/.test(text) ? 'success' : 'plain';
export function terminalExcerpt(rows: VideoProps['terminal'], rogue: boolean) {
  const numbers = rogue ? [37,38,39,40,41,44,45,46,49,51] : keeperRevealOrder;
  return rows.filter(row => numbers.includes(row.number) && row.text.trim() && !/^\s*[|│]\s*$/.test(row.text)).sort((a,b) => a.number-b.number);
}
