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
export const hookRevealAt = [0.6, 3, 5.4];
export const keeperRevealOrder = [3, 10, 16, 36, 50];
// Five whole-line reveals across the effective duration, with a final reading hold.
export const revealCount = (elapsed: number, seconds: number, count: number) => Math.min(count, 1 + Math.floor(Math.max(0, elapsed) / (seconds / count)));
export const textBand = (scene: Scene, subtitles: boolean, elapsed: number, seconds: number) => {
  if (!subtitles) return scene.caption;
  const cues = subtitleCues(scene.voiceover);
  const words = wordCount(scene.voiceover);
  const spoken = Math.min(1, Math.max(0, elapsed) / Math.max(.1, seconds - .4)) * words;
  let consumed = 0;
  return cues.find(cue => { consumed += wordCount(cue); return spoken < consumed; }) ?? cues.at(-1)!;
};
export function timeline(cut: Cut, audio: VideoProps['audio'] = {}) {
  let from = 0;
  return scenes.filter(scene => scene.cut === cut).map(scene => {
    const entry = audio[scene.id];
    const durationInFrames = Math.ceil(Math.max(scene.seconds, entry ? entry.seconds + 0.4 : wordCount(scene.voiceover) / 2.5 + 0.6) * FPS);
    const row = {scene, from, durationInFrames};
    from += durationInFrames;
    return row;
  });
}
export const totalFrames = (cut: Cut, audio: VideoProps['audio'] = {}) => timeline(cut, audio).reduce((sum, row) => sum + row.durationInFrames, 0);

// Editorial clause boundaries, approved for the final X narration. Exact words are retained.
export const xSubtitlePages: Record<string, string[]> = {
  A1: ["Counterweight hedges NEAR holdings with a short,", "and a keyless NEAR policy limits what the keeper can sign.", "Recorded on Hyperliquid testnet."],
  A2: ["Counterweight puts a keyless NEAR policy contract", "between the keeper and the exchange.", "The keeper proposes an order,", "the contract checks its bounds,", "and NEAR Chain Signatures sign it for Hyperliquid."],
  A3: ["The owner funded the account,", "then deleted the policy's access keys.", "The keeper opened a 3.5 NEAR short", "and closed it reduce-only.", "The position is flat."],
  A4: ["The recorded v2 run withdrew nearly forty-seven USDC net;", "destination arrival is unverified.", "Separately, a keyless v3 keeps reduce-only exits open outside the price band."],
  A5: ["In a local simulation with the real policy WASM and mocked signatures,", "NEAR rallied thirty-two and a half percent in a day.", "The keeper closed the hedge reduce-only,", "and the owner's nonce and balance stayed unchanged."],
  A6: ["Seven tested unauthorized requests,", "from oversized shorts to rogue withdrawals,", "were all rejected.", "After a timeout, the policy allows recovery;", "that signature was mocked."],
  A7: ["Counterweight is a supervised testnet prototype,", "built at NEAR HACKATHON.", "Run the local demo", "and check the testnet evidence yourself."],
};
export function subtitleCues(text: string) {
  const scene = scenes.find(s => s.cut === 'x' && s.voiceover === text);
  if (scene) return xSubtitlePages[scene.id]!;
  // Archived Judge uses sentence/clause boundaries, then bounded word groups.
  return text.split(/(?<=[,;.!?])\s+/).flatMap(clause => {
    const words = clause.trim().split(/\s+/);
    return Array.from({length: Math.ceil(words.length / 10)}, (_, i) => words.slice(i * 10, i * 10 + 10).join(' '));
  });
}
// Word-proportional placeholders until final recordings are available. Shared by
// subtitle timing and picture beats so they move together when durations ripple.
export function narrationAt(id: string, phrase: string, seconds: number) {
  const text = scenes.find(s => s.id === id)!.voiceover;
  const index = text.indexOf(phrase);
  if (index < 0) throw new Error(`Missing narration beat ${id}: ${phrase}`);
  return wordCount(text.slice(0, index)) / wordCount(text) * (seconds - .4);
}
export function architectureStage(elapsed: number, seconds: number) {
  return elapsed >= narrationAt('A2', 'for Hyperliquid', seconds) ? 3
    : elapsed >= narrationAt('A2', 'and NEAR Chain', seconds) ? 2
    : elapsed >= narrationAt('A2', 'the contract checks', seconds) ? 1 : 0;
}
export function rogueFocus(elapsed: number, seconds: number) {
  if (elapsed >= narrationAt('A6', 'After a timeout', seconds)) return 49;
  const at = narrationAt('A6', 'were all rejected', seconds);
  return elapsed < at / 3 ? 37 : elapsed < at * 2 / 3 ? 39 : 44;
}
export const terminalTone = (text: string) => text.startsWith('DEAD-MAN before') ? 'timelock'
  : text.startsWith('ROGUE ') && text.includes('REJECT') ? 'reject'
  : /PASS|SIGNED/.test(text) ? 'success' : 'plain';
export function terminalExcerpt(rows: VideoProps['terminal'], rogue: boolean) {
  const numbers = rogue ? [37,38,39,40,41,44,45,46,49,51] : keeperRevealOrder;
  return rows.filter(row => numbers.includes(row.number) && row.text.trim() && !/^\s*[|│]\s*$/.test(row.text)).sort((a,b) => a.number-b.number);
}
