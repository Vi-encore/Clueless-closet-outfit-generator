import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { useFlag } from '../flags';
import { cutOutAgain } from './photo/prepare';
import { CutoutProgressBar } from './cutout-progress-bar';
import { NO_CUTOUT_PROGRESS } from './photo/photo.constants';
import type { CutoutProgressState } from './photo/photo.interfaces';
import { cutoutProgress, failureOf } from './photo/photo.utils';
import { replaceCutout } from './wardrobe.api';
import { itemKeys } from './wardrobe.constants';
import type { Item, RecutPhotoProps } from './wardrobe.interfaces';

/**
 * Cutting the background out of a saved item, on this device: for an item saved when it
 * could not be done, or one whose cut-out kept a margin. Only the cut-out changes; the
 * colours stay as the person may already have set them.
 *
 * Not offered where the deployment switched cutting out off, nor without a photograph.
 */
export function RecutPhoto({ item }: RecutPhotoProps) {
  const queryClient = useQueryClient();
  const allowed = useFlag('photoCutout');
  const [progress, setProgress] = useState<CutoutProgressState>(NO_CUTOUT_PROGRESS);
  const recut = useMutation({
    mutationFn: async (photoUrl: string) => {
      setProgress(NO_CUTOUT_PROGRESS);

      const cutout = await cutOutAgain(photoUrl, (key, done, total) =>
        setProgress((state) => cutoutProgress(state, key, done, total)),
      );

      return replaceCutout(item.id, cutout);
    },
    onSuccess: (answer: Item) => {
      queryClient.setQueryData(itemKeys.one(answer.id), answer);
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
  const photoUrl = item.photoUrl;

  if (!allowed || photoUrl === null) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="secondary self-start"
        disabled={recut.isPending}
        onClick={() => recut.mutate(photoUrl)}
      >
        {recut.isPending
          ? uk.item.cuttingOut
          : item.cutoutUrl === null
            ? uk.item.cutOut
            : uk.item.cutOutAgain}
      </button>
      {recut.isPending && <CutoutProgressBar progress={progress} />}
      {recut.isError && (
        <ErrorDialog
          message={`${uk.item.cutOutFailed} ${failureOf(recut.error)}`}
          onClose={() => recut.reset()}
        />
      )}
    </>
  );
}
