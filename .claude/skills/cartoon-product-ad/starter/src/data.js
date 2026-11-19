// The single timing source: plan/beats.json (scenes + cues). Picture and sound both read it,
// so moving a cue in that file moves the animation and its sound together.
import beats from '../plan/beats.json' with { type: 'json' };

export const W = 1080, H = 1920;          // design space (9:16). Every coordinate in scenes is in these pixels.
export const FPS = beats.fps ?? 30;
export const BEATS = beats;
export const scenes = beats.scenes;
export const DURATION = beats.duration;

const cueTimes = Object.fromEntries(beats.cues.map(c => [c.id, c.t]));
/** Absolute time (seconds) of a named cue. Unknown ids throw, so a typo can never render silently. */
export function cue(id) {
  if (!(id in cueTimes)) throw new Error(`Unknown cue "${id}" - add it to plan/beats.json`);
  return cueTimes[id];
}
