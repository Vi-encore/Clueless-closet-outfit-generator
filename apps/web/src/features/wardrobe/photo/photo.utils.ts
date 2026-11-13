import { CUTOUT_STARTED, CUTOUT_UNFIT } from './photo.constants';

/**
 * The background-removal model for a device. A phone's tab ran out of memory on
 * `isnet_fp16` (Android Chrome reloaded it), while `isnet_quint8` cut cleanly there and on
 * an iPhone. On a desktop the larger one stays: tried on the same picture, the smaller
 * left the background in patches.
 */
export function cutoutModelFor(coarsePointer: boolean): 'isnet_quint8' | 'isnet_fp16' {
  return coarsePointer ? 'isnet_quint8' : 'isnet_fp16';
}

/**
 * Cut-outs running in this page right now. A start mark is a crash only when none is:
 * choosing a second photograph while the first is still being cut out is not one.
 */
let running = 0;

/** Storage that refuses, as a private window's may, is storage that remembers nothing. */
function remembered(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function remember(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Nothing remembered: cutting out is simply tried, as it always was.
  }
}

/** Marks a cut-out as begun, before the model is asked for anything. */
export function cutoutStarted(): void {
  running += 1;
  remember(CUTOUT_STARTED, String(Date.now()));
}

/** Clears the mark, whether the cut-out worked or failed without taking the tab with it. */
export function cutoutEnded(): void {
  running = Math.max(0, running - 1);

  if (running === 0) {
    remember(CUTOUT_STARTED, null);
  }
}

/**
 * Whether this browser should not try to cut out. A start mark left from before means the
 * tab died in the middle of one, and it is turned into the lasting decision here, the
 * first moment anything asks.
 */
export function cutoutUnfit(): boolean {
  if (running === 0 && remembered(CUTOUT_STARTED) !== null) {
    remember(CUTOUT_UNFIT, '1');
    remember(CUTOUT_STARTED, null);
  }

  return remembered(CUTOUT_UNFIT) !== null;
}

/** "Try again": forgets that this browser could not, and tries on the next photograph. */
export function forgetCutoutUnfit(): void {
  remember(CUTOUT_UNFIT, null);
  remember(CUTOUT_STARTED, null);
}
