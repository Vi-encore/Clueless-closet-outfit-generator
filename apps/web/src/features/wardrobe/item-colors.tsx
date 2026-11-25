import type { ItemColor } from '@closet/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { ColorEditor } from './color-editor';
import { setColors } from './wardrobe.api';
import { itemKeys } from './wardrobe.constants';
import type { Item, ItemColorsProps } from './wardrobe.interfaces';

/**
 * Changing a saved item's colours, for when the camera saw them wrong. The editor works on
 * a copy, so the card's own line keeps showing what is saved until the API has the change;
 * a refusal keeps the copy open, and nothing the person chose is lost.
 */
export function ItemColors({ item }: ItemColorsProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ItemColor[] | null>(null);
  const saving = useMutation({
    mutationFn: (colors: readonly ItemColor[]) => setColors(item.id, colors),
    onSuccess: (answer: Item) => {
      queryClient.setQueryData(itemKeys.one(answer.id), answer);
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      setDraft(null);
    },
  });

  if (draft === null) {
    return (
      <button
        type="button"
        className="secondary self-start"
        onClick={() => setDraft([...(item.colors ?? [])])}
      >
        {uk.item.changeColors}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ColorEditor colors={draft} onChange={setDraft} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="action"
          disabled={saving.isPending}
          onClick={() => saving.mutate(draft)}
        >
          {uk.item.saveColors}
        </button>
        <button type="button" disabled={saving.isPending} onClick={() => setDraft(null)}>
          {uk.dialog.cancel}
        </button>
      </div>
      {saving.isError && (
        <ErrorDialog message={uk.item.colorsFailed} onClose={() => saving.reset()} />
      )}
    </div>
  );
}
