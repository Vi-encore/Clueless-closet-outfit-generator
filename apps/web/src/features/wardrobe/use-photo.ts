import type { ItemColor } from '@closet/core';
import { useCallback, useRef, useState } from 'react';
import type { PhotoState } from './wardrobe.interfaces';
import { colorsOf, cutOut, readPhoto } from './photo/prepare';

/**
 * The new item's photograph, from the file chosen to the images that will be sent.
 *
 * Reading is quick and cutting out is slow - the first time, the model itself has to
 * arrive - so the original is there to look at while the cut-out is made. A cut-out that
 * fails leaves the original, which is still a photograph of the item. Choosing another
 * file while one is being worked on makes the first one's results arrive to nobody.
 *
 * With `cutOutAllowed` false the cut-out is not attempted at all, so the model it needs is
 * never fetched: that is what a deployment switching the `photoCutout` flag off asks for.
 */
export function usePhoto(onColors: (colors: ItemColor[]) => void, cutOutAllowed: boolean) {
  const [photo, setPhoto] = useState<PhotoState>({ step: 'none' });
  const [useCutout, setUseCutout] = useState(true);
  const latest = useRef(0);

  const choose = useCallback(
    (file: File) => {
      latest.current += 1;
      const attempt = latest.current;
      const current = () => attempt === latest.current;

      setPhoto({ step: 'reading' });
      setUseCutout(true);

      const work = async () => {
        let read;

        try {
          read = await readPhoto(file);
        } catch {
          if (current()) {
            setPhoto({ step: 'unreadable' });
          }

          return;
        }

        const { image, original } = read;

        if (!current()) {
          image.close();

          return;
        }

        let cutout: Blob | null = null;

        if (cutOutAllowed) {
          setPhoto({ step: 'cutting', original });

          // Null for "could not": the model would not load, or the tab ran out of memory.
          cutout = await cutOut(image)
            .catch(() => null)
            .finally(() => image.close());
        } else {
          image.close();
        }

        if (!current()) {
          return;
        }

        setPhoto({ step: 'ready', original, cutout, cutoutSkipped: !cutOutAllowed });

        // The cut-out's colors are the item's; the original's include whatever it lay on.
        const found = await colorsOf(cutout ?? original).catch(() => []);

        if (current()) {
          onColors(found);
        }
      };

      void work();
    },
    [onColors, cutOutAllowed],
  );

  /** The images to send, or null while there are none yet. */
  const kept = () =>
    photo.step === 'ready'
      ? { original: photo.original, cutout: useCutout ? photo.cutout : null }
      : null;

  return { photo, useCutout, setUseCutout, choose, kept };
}
