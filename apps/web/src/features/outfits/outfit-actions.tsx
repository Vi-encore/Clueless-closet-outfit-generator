import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { saveOutfit, setReaction, unsaveOutfit, wearOutfit } from './outfits.api';
import type { Outfit, OutfitPanelProps, Reaction } from './outfits.interfaces';
import { outfitKeys } from './outfits.constants';
import { calendarDate } from './outfits.utils';

/**
 * Like, save and wear. Every answer that is an outfit replaces the cached one, so whichever
 * screen shows it shows the change; the saved list is asked again behind it.
 */
export function OutfitActions({ outfit }: OutfitPanelProps) {
  const queryClient = useQueryClient();
  const [wornOn, setWornOn] = useState<string | null>(null);
  const settle = (answer: Outfit) => {
    queryClient.setQueryData(outfitKeys.one(answer.id), answer);
    void queryClient.invalidateQueries({ queryKey: outfitKeys.saved() });
  };

  const reacting = useMutation({
    mutationFn: (reaction: Reaction | null) => setReaction(outfit.id, reaction),
    onSuccess: settle,
  });
  const saving = useMutation({
    mutationFn: () => (outfit.savedAt === null ? saveOutfit(outfit.id) : unsaveOutfit(outfit.id)),
    onSuccess: settle,
  });
  const wearing = useMutation({
    mutationFn: () => wearOutfit(outfit.id),
    onSuccess: (record) => setWornOn(record.date),
  });
  const failed = [reacting, saving, wearing].find((mutation) => mutation.isError);

  const toggle = (reaction: Reaction) => (
    <button
      type="button"
      aria-pressed={outfit.reaction === reaction}
      disabled={reacting.isPending}
      onClick={() => reacting.mutate(outfit.reaction === reaction ? null : reaction)}
    >
      {reaction === 'like' ? uk.outfits.like : uk.outfits.dislike}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex flex-wrap gap-2">
        <legend>{uk.outfits.reactions}</legend>
        {toggle('like')}
        {toggle('dislike')}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving.isPending} onClick={() => saving.mutate()}>
          {outfit.savedAt === null ? uk.outfits.save : uk.outfits.unsave}
        </button>
        <button type="button" disabled={wearing.isPending} onClick={() => wearing.mutate()}>
          {uk.outfits.wear}
        </button>
      </div>
      {wornOn !== null && <output>{uk.outfits.wornOn(calendarDate(wornOn))}</output>}
      {failed !== undefined && (
        <ErrorDialog message={uk.errors.unavailable} onClose={() => failed.reset()} />
      )}
    </div>
  );
}
