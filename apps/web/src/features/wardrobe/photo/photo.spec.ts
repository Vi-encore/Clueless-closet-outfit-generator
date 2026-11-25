import { describe, expect, it } from 'vitest';
import { encode } from './encode';
import { fitWithin } from './fit-within';
import { NO_CUTOUT_PROGRESS } from './photo.constants';
import { cutoutModelFor, cutoutProgress, failureOf, fractionOf } from './photo.utils';
import type { RecordingCanvas } from '../../../../test/test.interfaces';

/**
 * A canvas that remembers the size it was given and answers `toBlob` the way a browser
 * would: with the type asked for where it can encode it, and PNG where it cannot.
 */
function aCanvas(encodesWebp: boolean): RecordingCanvas {
  const canvas: RecordingCanvas = {
    width: 0,
    height: 0,
    drawnAt: [],
    drawnFrom: [],
    getContext: () => ({
      drawImage: (
        _image: CanvasImageSource,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        _dx: number,
        _dy: number,
        width: number,
        height: number,
      ) => {
        canvas.drawnAt.push({ width, height });
        canvas.drawnFrom.push({ x: sx, y: sy, width: sw, height: sh });
      },
    }),
    toBlob: (callback: BlobCallback, type?: string) => {
      const made = type === 'image/webp' && !encodesWebp ? 'image/png' : (type ?? 'image/png');

      callback(new Blob(['pixels'], { type: made }));
    },
  };

  return canvas;
}

/** An image of a given size: all `encode` reads of one is its size. */
const anImage = (width: number, height: number) => ({ width, height }) as ImageBitmap;

describe('Requirement: Photographs are made smaller before sending', () => {
  it('Scenario: A large photograph is made smaller', async () => {
    const photo = anImage(4032, 3024);
    const originalCanvas = aCanvas(true);
    const cutoutCanvas = aCanvas(true);

    await encode(photo, 'original', () => originalCanvas);
    await encode(photo, 'cutout', () => cutoutCanvas);

    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(originalCanvas.drawnAt).toEqual([{ width: 1600, height: 1200 }]);
    expect(cutoutCanvas.drawnAt).toEqual([{ width: 1024, height: 768 }]);
  });

  it('Scenario: A small photograph keeps its size', async () => {
    const photo = anImage(800, 600);
    const originalCanvas = aCanvas(true);
    const cutoutCanvas = aCanvas(true);

    await encode(photo, 'original', () => originalCanvas);
    await encode(photo, 'cutout', () => cutoutCanvas);

    expect(originalCanvas.drawnAt).toEqual([{ width: 800, height: 600 }]);
    expect(cutoutCanvas.drawnAt).toEqual([{ width: 800, height: 600 }]);
  });

  it('Scenario: WebP where it can be made', async () => {
    const photo = anImage(800, 600);

    const original = await encode(photo, 'original', () => aCanvas(true));
    const cutout = await encode(photo, 'cutout', () => aCanvas(true));

    expect([original.type, cutout.type]).toEqual(['image/webp', 'image/webp']);
  });

  it('Scenario: A browser without WebP still sends something the API accepts', async () => {
    const photo = anImage(800, 600);

    const original = await encode(photo, 'original', () => aCanvas(false));
    const cutout = await encode(photo, 'cutout', () => aCanvas(false));

    expect([original.type, cutout.type]).toEqual(['image/jpeg', 'image/png']);
  });

  it('keeps a tall photograph tall', () => {
    expect(fitWithin(3024, 4032, 1024)).toEqual({ width: 768, height: 1024 });
  });
});

describe('Requirement: A cut-out is trimmed to the item', () => {
  it('encodes only the box it is given, at the size of that box', async () => {
    const canvas = aCanvas(true);
    const box = { x: 100, y: 50, width: 400, height: 600 };

    await encode(anImage(1024, 768), 'cutout', () => canvas, box);

    expect(canvas.drawnFrom).toEqual([box]);
    expect(canvas.drawnAt).toEqual([{ width: 400, height: 600 }]);
  });

  it('encodes the whole image when no box is given', async () => {
    const canvas = aCanvas(true);

    await encode(anImage(800, 600), 'cutout', () => canvas);

    expect(canvas.drawnFrom).toEqual([{ x: 0, y: 0, width: 800, height: 600 }]);
  });
});

describe('Requirement: The cut-out model follows the device', () => {
  it('Scenario: A phone uses the smaller model', () => {
    expect(cutoutModelFor(true)).toBe('isnet_quint8');
  });

  it('Scenario: A computer uses the larger model', () => {
    expect(cutoutModelFor(false)).toBe('isnet_fp16');
  });
});

describe('failureOf', () => {
  it('names an error by its kind and its message', () => {
    expect(failureOf(new TypeError('Failed to fetch'))).toBe('TypeError: Failed to fetch');
  });

  it('says what anything else thrown was', () => {
    expect(failureOf('no WebGL')).toBe('no WebGL');
    expect(failureOf(undefined)).toBe('undefined');
  });
});

describe('cutoutProgress', () => {
  it('starts downloading, at nothing', () => {
    expect(NO_CUTOUT_PROGRESS.phase).toBe('fetch');
    expect(fractionOf(NO_CUTOUT_PROGRESS)).toBe(0);
  });

  it('sums the bytes of every file reported so far', () => {
    const one = cutoutProgress(NO_CUTOUT_PROGRESS, 'fetch:/models/a', 3, 12);
    const two = cutoutProgress(one, 'fetch:/models/b', 1, 4);

    expect(fractionOf(two)).toBe(0.25);
  });

  it('follows a file as it arrives, without counting it twice', () => {
    let state = cutoutProgress(NO_CUTOUT_PROGRESS, 'fetch:/models/a', 3, 12);
    state = cutoutProgress(state, 'fetch:/models/b', 1, 4);
    state = cutoutProgress(state, 'fetch:/models/a', 12, 12);

    expect(fractionOf(state)).toBe(13 / 16);
  });

  it('turns to cutting out at the first compute step, and counts its steps', () => {
    const fetched = cutoutProgress(NO_CUTOUT_PROGRESS, 'fetch:/models/a', 12, 12);
    const masked = cutoutProgress(fetched, 'compute:mask', 2, 4);

    expect(masked.phase).toBe('compute');
    expect(fractionOf(masked)).toBe(0.5);
  });
});
