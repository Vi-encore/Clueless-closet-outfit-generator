import { useEffect, useId, useState, type ChangeEvent } from 'react';
import type {
  ColorListProps,
  PhotoStepProps,
  PreviewProps,
  ShownPreview,
} from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';

/**
 * A picture of a blob. Read into a data URL rather than given an object URL: there is
 * nothing to let go of afterwards, and these images are a few hundred kilobytes at most.
 */
function Preview({ image, alt }: PreviewProps) {
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

/**
 * Where the photograph comes from and what became of it.
 *
 * Two inputs rather than one, because a phone given `capture` goes straight to the
 * camera and offers nothing else, and a person adding something they photographed last
 * week needs the gallery. Each is hidden behind its label, which is what is pressed.
 */
export function PhotoStep({ photo, useCutout, onChoose, onUseCutout }: PhotoStepProps) {
  const cameraId = useId();
  const galleryId = useId();
  const useCutoutId = useId();

  const chosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file !== undefined) {
      onChoose(file);
    }

    // So that choosing the same file again is still a choice.
    event.target.value = '';
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend>{uk.newItem.photo}</legend>
      <div className="flex flex-wrap gap-2">
        <label htmlFor={cameraId} className="action">
          {uk.newItem.camera}
        </label>
        <input
          id={cameraId}
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={chosen}
        />
        <label htmlFor={galleryId} className="action">
          {uk.newItem.gallery}
        </label>
        <input id={galleryId} className="sr-only" type="file" accept="image/*" onChange={chosen} />
      </div>

      {photo.step === 'reading' && <p>{uk.newItem.preparing}</p>}
      {photo.step === 'unreadable' && <p role="alert">{uk.newItem.unreadable}</p>}
      {photo.step === 'cutting' && (
        <>
          <p>{uk.newItem.cuttingOut}</p>
          <Preview image={photo.original} alt={uk.newItem.originalAlt} />
        </>
      )}
      {photo.step === 'ready' &&
        (photo.cutout === null ? (
          <>
            <p>{uk.newItem.cutFailed}</p>
            <Preview image={photo.original} alt={uk.newItem.originalAlt} />
          </>
        ) : (
          <>
            {useCutout ? (
              <Preview image={photo.cutout} alt={uk.newItem.cutoutAlt} />
            ) : (
              <Preview image={photo.original} alt={uk.newItem.originalAlt} />
            )}
            <div className="field-row">
              <input
                id={useCutoutId}
                type="checkbox"
                checked={useCutout}
                onChange={(event) => onUseCutout(event.target.checked)}
              />
              <label htmlFor={useCutoutId}>{uk.newItem.useCutout}</label>
            </div>
          </>
        ))}
    </fieldset>
  );
}

/** The colors found in the photograph, each of which the person can take away. */
export function ColorList({ colors, onRemove }: ColorListProps) {
  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="field-row-stacked">
      <span>{uk.newItem.colors}</span>
      <ul aria-label={uk.newItem.colors} className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <li key={color.family} className="flex items-center gap-1">
            <span className="swatch" style={{ backgroundColor: color.hex }} />
            {uk.colors[color.family]}
            <button
              type="button"
              className="min-w-0 px-1"
              aria-label={uk.newItem.removeColor(uk.colors[color.family])}
              onClick={() => onRemove(color)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
