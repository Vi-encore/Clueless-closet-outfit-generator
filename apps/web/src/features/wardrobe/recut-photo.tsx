import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { useFlag } from '../flags';
import { cutOutAgain } from './photo/prepare';
import { failureOf } from './photo/photo.utils';
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
  const recut = useMutation({
    mutationFn: async (photoUrl: string) => replaceCutout(item.id, await cutOutAgain(photoUrl)),
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
      {recut.isError && (
        <ErrorDialog
          message={`${uk.item.cutOutFailed} ${failureOf(recut.error)}`}
          onClose={() => recut.reset()}
        />
      )}
    </>
  );
}
