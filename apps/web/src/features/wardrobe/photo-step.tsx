import { useId, type ChangeEvent } from 'react';
import type { PhotoStepProps } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';
import { PhotoPreview } from './photo-preview';

/**
 * Where the photograph comes from and what became of it.
 *
 * Two inputs rather than one, because a phone given `capture` goes straight to the
 * camera and offers nothing else, and a person adding something they photographed last
 * week needs the gallery. Each is hidden behind its label, which is what is pressed.
 *
 * Neither takes a photograph until the feature flags are known: whether it will be cut
 * out depends on them, and a photograph chosen in that moment would start the model
 * downloading on a deployment that switched cutting out off.
 */
export function PhotoStep({
  photo,
  choosable,
  useCutout,
  onChoose,
  onUseCutout,
  onTryCutout,
}: PhotoStepProps) {
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
          disabled={!choosable}
          onChange={chosen}
        />
        <label htmlFor={galleryId} className="action">
          {uk.newItem.gallery}
        </label>
        <input
          id={galleryId}
          className="sr-only"
          type="file"
          accept="image/*"
          disabled={!choosable}
          onChange={chosen}
        />
      </div>

      {photo.step === 'reading' && <p>{uk.newItem.preparing}</p>}
      {photo.step === 'unreadable' && <p role="alert">{uk.newItem.unreadable}</p>}
      {photo.step === 'cutting' && (
        <>
          <p>{uk.newItem.cuttingOut}</p>
          <PhotoPreview image={photo.original} alt={uk.newItem.originalAlt} />
        </>
      )}
      {photo.step === 'ready' &&
        (photo.cutout === null ? (
          <>
            {/* Switched off is not a failure, so it is not reported as one. */}
            {photo.skipped === null && <p>{uk.newItem.cutFailed}</p>}
            {photo.skipped === 'unfit' && (
              <>
                <p>{uk.newItem.cutoutUnfit}</p>
                <button type="button" className="self-start" onClick={onTryCutout}>
                  {uk.newItem.tryCutout}
                </button>
              </>
            )}
            <PhotoPreview image={photo.original} alt={uk.newItem.originalAlt} />
          </>
        ) : (
          <>
            {useCutout ? (
              <PhotoPreview image={photo.cutout} alt={uk.newItem.cutoutAlt} />
            ) : (
              <PhotoPreview image={photo.original} alt={uk.newItem.originalAlt} />
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
