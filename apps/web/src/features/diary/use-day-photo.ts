import { useCallback, useRef, useState } from 'react';
import { readPhoto } from '../wardrobe';
import type { DayPhoto } from './diary.interfaces';

/**
 * The photo chosen for a day, read and shrunk as an item's is, but never cut out: it is a
 * photo of a person, and the background is part of the day. Choosing another file while
 * one is being read makes the first one's result arrive to nobody.
 */
export function useDayPhoto() {
  const [photo, setPhoto] = useState<DayPhoto>({ step: 'unchanged' });
  const latest = useRef(0);

  const choose = useCallback((file: File) => {
    latest.current += 1;
    const attempt = latest.current;
    setPhoto({ step: 'reading' });

    readPhoto(file).then(
      ({ image, original }) => {
        image.close();
        if (attempt === latest.current) {
          setPhoto({ step: 'chosen', blob: original });
        }
      },
      () => {
        if (attempt === latest.current) {
          setPhoto({ step: 'unreadable' });
        }
      },
    );
  }, []);

  const remove = useCallback(() => {
    latest.current += 1;
    setPhoto({ step: 'removed' });
  }, []);

  const reset = useCallback(() => {
    latest.current += 1;
    setPhoto({ step: 'unchanged' });
  }, []);

  return { photo, choose, remove, reset };
}
