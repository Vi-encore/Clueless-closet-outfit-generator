export interface Size {
  width: number;
  height: number;
}

/** Which of an item's two images is being made: each has its own size and fallback. */
export type PhotoKind = 'original' | 'cutout';

/** Anything with a size that can be drawn: an `ImageBitmap`, mostly. */
export type SizedImage = CanvasImageSource & Size;

/** The one drawing call `encode` makes, so a test can stand in for a real context. */
export interface DrawingContext {
  drawImage(image: CanvasImageSource, x: number, y: number, width: number, height: number): void;
}

/** As much of a canvas as `encode` uses. A real `<canvas>` is one. */
export interface DrawingCanvas extends Size {
  getContext(kind: '2d'): DrawingContext | null;
  toBlob(callback: BlobCallback, type?: string, quality?: number): void;
}

export type MakeCanvas = () => DrawingCanvas;

/** A photograph once it has been read: the picture to work from, and what is sent. */
export interface ReadPhoto {
  /** Turned the right way up already. Closed by whoever is done with it last. */
  image: ImageBitmap;
  original: Blob;
}

/** What the model says while it works: which file, and how far through it. */
export type CutOutProgress = (key: string, current: number, total: number) => void;
