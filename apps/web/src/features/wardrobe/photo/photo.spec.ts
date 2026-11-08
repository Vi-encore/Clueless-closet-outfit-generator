import { describe, expect, it } from 'vitest';
import { encode } from './encode';
import { fitWithin } from './fit-within';
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
    getContext: () => ({
      drawImage: (
        _image: CanvasImageSource,
        _x: number,
        _y: number,
        width: number,
        height: number,
      ) => {
        canvas.drawnAt.push({ width, height });
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
