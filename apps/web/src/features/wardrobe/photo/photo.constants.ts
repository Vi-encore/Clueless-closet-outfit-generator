import type { CutoutProgressState } from './photo.interfaces';

/** Thrown when a file cannot be drawn: not an image, or one this browser cannot read. */
export const UNREADABLE_PHOTO = new Error('That file cannot be read as a photograph');

/**
 * Written to `localStorage` right before a cut-out and removed when it ends. Still there
 * when the next photograph is chosen, it means the tab died in the middle of one.
 */
export const CUTOUT_STARTED = 'closet:cutout-started';

/** This browser could not finish a cut-out, so it saves originals until told to try again. */
export const CUTOUT_UNFIT = 'closet:cutout-unfit';

/** A cut-out before anything has been reported. */
export const NO_CUTOUT_PROGRESS: CutoutProgressState = { phase: 'fetch', files: {}, step: 0 };
