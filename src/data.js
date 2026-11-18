// Single timing source: plan/beats.json (scenes + cues). Both the renderer and the audio script read it.
import beats from '../plan/beats.json' with { type: 'json' };
export const W = 1080, H = 1920, FPS = 30;
export const BEATS = beats;
export const scenes = beats.scenes;
export const DURATION = beats.duration;
const cueMap = Object.fromEntries(beats.cues.map(c => [c.id, c.t]));
/** Absolute time (s) of a named cue. Throws on unknown ids so typos never render silently. */
export function cue(id) {
  if (!(id in cueMap)) throw new Error('Unknown cue: ' + id);
  return cueMap[id];
}
