import { colorsFromPixels, type ItemColor } from '@closet/core';
import { encode } from './encode';
import { fitWithin } from './fit-within';
import { opaqueBox } from './trim';
import type { Box, CutOutProgress, ReadPhoto } from './photo.interfaces';
import { UNREADABLE_PHOTO } from './photo.constants';

/** Colors need the gist of an image, not its detail, and this many pixels is quick. */
const COLOR_SAMPLE_SIDE = 128;

/**
 * Reads a file into a picture turned the right way up, and makes the original to send.
 *
 * A phone's photograph lies on its side and says so in EXIF; `from-image` applies that.
 * HEIC is read where the browser can read it, which is Safari; elsewhere it is simply a
 * file that cannot be read, and is answered as one.
 */
export async function readPhoto(file: File): Promise<ReadPhoto> {
  let image: ImageBitmap;

  try {
    image = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw UNREADABLE_PHOTO;
  }

  return { image, original: await encode(image, 'original') };
}

/**
 * The item without its background, encoded for sending.
 *
 * The library is imported here and nowhere else, so that its code and its model are
 * fetched when somebody adds an item rather than with the app. It is given the picture
 * already at the cut-out's size: a phone's twelve megapixels are more than an iPhone's
 * tab will hold through the model, and the cut-out is never kept larger anyway.
 */
export async function cutOut(image: ImageBitmap, progress?: CutOutProgress): Promise<Blob> {
  const [source, { removeBackground }] = await Promise.all([
    encode(image, 'cutout'),
    import('@imgly/background-removal'),
  ]);
  // `isnet_fp16` where there is room for it: on a desktop, tried on the same picture,
  // the smaller `isnet_quint8` left the background in patches and this one left none.
  // A phone's tab is another matter: Android Chrome reloaded it on fp16, out of memory,
  // while quint8 cut cleanly there and on an iPhone (reach-from-a-phone, on real phones).
  const cut = await removeBackground(source, {
    model: window.matchMedia('(pointer: coarse)').matches ? 'isnet_quint8' : 'isnet_fp16',
    output: { format: 'image/png' },
    ...(progress === undefined ? {} : { progress }),
  });
  const drawn = await createImageBitmap(cut);

  try {
    // Cropped to the item: an image with nothing opaque in it is kept whole.
    return await encode(drawn, 'cutout', undefined, itemBox(drawn) ?? undefined);
  } finally {
    drawn.close();
  }
}

/**
 * Where the item is in a cut-out. Reading its pixels is safe here: the image came from the
 * model in this tab, not from storage, so the canvas is never tainted.
 */
function itemBox(image: ImageBitmap): Box | null {
  const canvas = document.createElement('canvas');

  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');

  if (context === null) {
    return null;
  }

  context.drawImage(image, 0, 0);

  return opaqueBox(
    context.getImageData(0, 0, image.width, image.height).data,
    image.width,
    image.height,
  );
}

/** The colors of an image, read from a small copy of it. */
export async function colorsOf(image: Blob): Promise<ItemColor[]> {
  const drawn = await createImageBitmap(image);

  try {
    const { width, height } = fitWithin(drawn.width, drawn.height, COLOR_SAMPLE_SIDE);
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (context === null) {
      return [];
    }

    context.drawImage(drawn, 0, 0, width, height);

    return colorsFromPixels(context.getImageData(0, 0, width, height).data);
  } finally {
    drawn.close();
  }
}
