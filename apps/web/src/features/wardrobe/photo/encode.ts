import { fitWithin } from './fit-within';
import type { Box, DrawingCanvas, MakeCanvas, PhotoKind, SizedImage } from './photo.interfaces';

/**
 * How large each image is kept. The original is for looking at and for a better model
 * later; the cut-out is for the doll, which never draws one larger than this.
 */
const LONGEST: Record<PhotoKind, number> = { original: 1600, cutout: 1024 };

/**
 * What to send where WebP cannot be made. The original has no transparency to lose, so
 * JPEG keeps it small; the cut-out is nothing but transparency around the item.
 */
const FALLBACK: Record<PhotoKind, string> = { original: 'image/jpeg', cutout: 'image/png' };

const QUALITY = 0.85;

const aCanvas: MakeCanvas = () => document.createElement('canvas');

function blobOf(canvas: DrawingCanvas, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob === null ? reject(new Error('The canvas made no image')) : resolve(blob)),
      type,
      QUALITY,
    );
  });
}

/**
 * Draws an image at the size its kind allows and encodes it, as WebP where the browser
 * can. A browser that cannot encode WebP does not say so: it quietly answers PNG. So the
 * type that came back is what is believed, not the type that was asked for.
 *
 * `source` is the part of the image to keep, the whole of it when left out.
 */
export async function encode(
  image: SizedImage,
  kind: PhotoKind,
  makeCanvas: MakeCanvas = aCanvas,
  source: Box = { x: 0, y: 0, width: image.width, height: image.height },
): Promise<Blob> {
  const { width, height } = fitWithin(source.width, source.height, LONGEST[kind]);
  const canvas = makeCanvas();

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('No 2D canvas here');
  }

  context.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, width, height);

  const webp = await blobOf(canvas, 'image/webp');

  return webp.type === 'image/webp' ? webp : blobOf(canvas, FALLBACK[kind]);
}
