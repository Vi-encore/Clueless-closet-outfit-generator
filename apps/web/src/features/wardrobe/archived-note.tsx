import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ArchivedNoteProps } from './wardrobe.interfaces';
import { restoreItem } from './wardrobe.api';
import { itemKeys } from './wardrobe.constants';
import type { Item } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';

/**
 * When and why an item left, and the way back. Restoring stays on the card: the person
 * is looking at the thing they just brought back. The answer goes into the cache as the
 * sharing switch's does, and every list - the archive it leaves and the wardrobe it
 * returns to - is asked again.
 */
export function ArchivedNote({ item }: ArchivedNoteProps) {
  const queryClient = useQueryClient();
  const restoring = useMutation({
    mutationFn: () => restoreItem(item.id),
    onSuccess: (answer: Item) => {
      queryClient.setQueryData(itemKeys.one(answer.id), answer);
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
  const date =
    item.archivedAt === null ? '' : new Date(item.archivedAt).toLocaleDateString('uk-UA');
  // A reason is optional to the API; an item archived without one says only when.
  const reason = item.archivedReason === null ? '—' : uk.archiveReasons[item.archivedReason];

  return (
    <div className="well flex flex-col gap-2">
      <p>{uk.item.archived(date, reason)}</p>
      <button
        type="button"
        className="self-start"
        disabled={restoring.isPending}
        onClick={() => restoring.mutate()}
      >
        {uk.item.restore}
      </button>
      {restoring.isError && (
        <ErrorDialog message={uk.errors.unavailable} onClose={() => restoring.reset()} />
      )}
    </div>
  );
}
