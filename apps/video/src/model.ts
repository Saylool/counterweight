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
  return cues[Math.min(cues.length - 1, Math.floor(elapsed / seconds * cues.length))]!;
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

// Short, whole-word cues paced across the scene; concatenation preserves exact VO.
export function subtitleCues(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  return Array.from({length: Math.ceil(words.length / 9)}, (_, i) => words.slice(i * 9, i * 9 + 9).join(' '));
}
export function terminalExcerpt(rows: VideoProps['terminal'], rogue: boolean) {
  const numbers = rogue ? [37,38,39,40,41,44,45,46,49,51] : keeperRevealOrder;
  return rows.filter(row => numbers.includes(row.number) && row.text.trim() && !/^\s*[|│]\s*$/.test(row.text)).sort((a,b) => a.number-b.number);
}
