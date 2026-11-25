import { uk } from '../../shared/i18n/uk';
import { fractionOf } from './photo/photo.utils';
import type { CutoutProgressBarProps } from './wardrobe.interfaces';

/**
 * How far a cut-out has got, as Windows 98 drew it: blue blocks in a sunken well, with
 * what is happening above them. A `<progress>`, so a screen reader hears its value too;
 * its look is in wardrobe.css.
 */
export function CutoutProgressBar({ progress }: CutoutProgressBarProps) {
  const percent = Math.round(fractionOf(progress) * 100);

  return (
    <div className="flex flex-col gap-1">
      <span>
        {progress.phase === 'fetch' ? uk.newItem.downloadingModel : uk.newItem.cuttingStep}
      </span>
      <progress
        aria-label={uk.newItem.cutoutProgress}
        className="cutout-progress"
        max={100}
        value={percent}
      />
    </div>
  );
}
