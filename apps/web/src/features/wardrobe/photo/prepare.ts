import { colorsFromPixels, type ItemColor } from '@closet/core';
import { encode } from './encode';
import { fitWithin } from './fit-within';
import { dropStrays, opaqueBox } from './trim';
import type { CleanedItem, CutOutProgress, PhotoKind, ReadPhoto } from './photo.interfaces';
import { UNREADABLE_PHOTO } from './photo.constants';
import { cutoutEnded, cutoutModelFor, cutoutStarted } from './photo.utils';

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
  const cut = await removeBackground(source, {
    model: cutoutModelFor(window.matchMedia('(pointer: coarse)').matches),
    output: { format: 'image/png' },
    ...(progress === undefined ? {} : { progress }),
  });
  const drawn = await createImageBitmap(cut);

  try {
    const cleaned = cleanedItem(drawn);

    // Cropped to the item: an image with nothing opaque in it is kept whole.
    return cleaned === null
      ? await encode(drawn, 'cutout')
      : await encode(cleaned.canvas, 'cutout', undefined, cleaned.box ?? undefined);
  } finally {
    drawn.close();
  }
}

/**
 * The model's answer on a canvas with the strays it kept apart from the item made
 * transparent, and the box of what is left. Reading its pixels is safe here: the image came
 * from the model in this tab, not from storage, so the canvas is never tainted. Null where
 * there is no 2D canvas, and the answer is then sent as it came.
 */
function cleanedItem(image: ImageBitmap): CleanedItem | null {
  const canvas = document.createElement('canvas');

  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');

  if (context === null) {
    return null;
  }

  context.drawImage(image, 0, 0);

  const pixels = context.getImageData(0, 0, image.width, image.height);

  if (dropStrays(pixels.data, image.width, image.height) > 0) {
    context.putImageData(pixels, 0, 0);
  }

  return { canvas, box: opaqueBox(pixels.data, image.width, image.height) };
}

/**
 * A saved item's cut-out made again from its original, read from storage, cut out and
 * trimmed exactly as a new item's is.
 *
 * `no-store` because the original was most likely shown before in an `<img>`, which is not
 * a CORS request: a cached copy of that answer has no CORS header, and would fail this
 * read. The marks around it are the form's, so a tab that dies here is remembered too.
 */
export async function cutOutAgain(photoUrl: string, progress?: CutOutProgress): Promise<Blob> {
  const answer = await fetch(photoUrl, { cache: 'no-store', credentials: 'omit' });

  if (!answer.ok) {
    throw new Error(`The photograph answered ${answer.status}`);
  }

  const blob = await answer.blob();
  const { image } = await readPhoto(new File([blob], 'original', { type: blob.type }));

  cutoutStarted();

  try {
    return await cutOut(image, progress);
  } finally {
    cutoutEnded();
    image.close();
  }
}

/**
 * The image turned a quarter clockwise, encoded again as its kind. Width and height swap;
 * the canvas is moved right by its new width and turned, so the old top edge lands on the
 * right. A cut-out keeps its transparency: the canvas starts transparent.
 */
export async function turn(image: Blob, kind: PhotoKind): Promise<Blob> {
  const drawn = await createImageBitmap(image);

  try {
    const canvas = document.createElement('canvas');

    canvas.width = drawn.height;
    canvas.height = drawn.width;

    const context = canvas.getContext('2d');

    if (context === null) {
      throw new Error('No 2D canvas here');
    }

    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
    context.drawImage(drawn, 0, 0);

    const turned = await createImageBitmap(canvas);

    try {
      return await encode(turned, kind);
    } finally {
      turned.close();
    }
  } finally {
    drawn.close();
  }
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
