import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import type { SharingSwitchProps } from './wardrobe.interfaces';
import { setVisibility } from './wardrobe.api';
import { itemKeys } from './wardrobe.constants';
import type { Item } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';

/**
 * The API answers with the whole item, so the answer goes straight into the cache: the
 * card shows it, and so does the card opened again later, before anything is asked.
 */
export function SharingSwitch({ item }: SharingSwitchProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const sharing = useMutation({
    mutationFn: (shared: boolean) => setVisibility(item.id, shared ? 'friends' : 'private'),
    onSuccess: (answer: Item) => {
      queryClient.setQueryData(itemKeys.one(answer.id), answer);
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });

  return (
    <div className="field-row">
      <input
        id={id}
        type="checkbox"
        checked={item.visibility === 'friends'}
        disabled={sharing.isPending}
        onChange={(event) => sharing.mutate(event.target.checked)}
      />
      <label htmlFor={id}>{uk.item.share}</label>
      {sharing.isError && (
        <ErrorDialog message={uk.errors.unavailable} onClose={() => sharing.reset()} />
      )}
    </div>
  );
}
