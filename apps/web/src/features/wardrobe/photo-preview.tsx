import { useEffect, useState } from 'react';
import type { PreviewProps, ShownPreview } from './wardrobe.interfaces';

/**
 * A picture of a blob. Read into a data URL rather than given an object URL: there is
 * nothing to let go of afterwards, and these images are a few hundred kilobytes at most.
 */
export function PhotoPreview({ image, alt }: PreviewProps) {
  const [shown, setShown] = useState<ShownPreview | null>(null);

  useEffect(() => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setShown({ image, url: reader.result });
      }
    };
    reader.readAsDataURL(image);

    return () => reader.abort();
  }, [image]);

  // Only the picture of this blob: the one before stays hidden until this one is read.
  return shown?.image === image ? (
    <img className="photo-preview" src={shown.url} alt={alt} />
  ) : null;
}
