import { describe, expect, it } from 'vitest';
import { encode } from './encode';
import { fitWithin } from './fit-within';
import { cutoutModelFor } from './photo.utils';
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
