import { COMPONENTS } from '@closet/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { Doll } from './doll/doll';
import { saveOutfit, setReaction, unsaveOutfit, wearOutfit } from './outfits.api';
import type { Outfit, OutfitPanelProps, Reaction, ReasonProps } from './outfits.interfaces';
import { outfitKeys } from './outfits.queries';

const score = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `YYYY-MM-DD` as `DD.MM.YYYY`, by its parts: through `Date` it would move a day west of UTC. */
function calendarDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** The outfit on the doll, why it was chosen, and what can be done with it. */
export function OutfitPanel({ outfit }: OutfitPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="w-full sm:w-1/2">
        <Doll items={outfit.items} />
      </div>
      <div className="flex flex-col gap-4 self-stretch sm:flex-1">
        <Reason outfit={outfit} />
        <Actions outfit={outfit} />
      </div>
    </div>
  );
}

/** One line per component, and Cher's verdict when the whole is below zero. */
function Reason({ outfit }: ReasonProps) {
  if (outfit.score === null) {
    return null;
  }

  const { total, breakdown } = outfit.score;

  return (
    <div className="flex flex-col gap-2">
      {total < 0 && <p className="mismatch title-bar-text">{uk.outfits.mismatch}</p>}
      <ul aria-label={uk.outfits.why} className="tree-view">
        {COMPONENTS.map((name) => (
          <li key={name}>
            <span>{uk.outfits.components[name]}</span>: {score.format(breakdown[name])}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Like, save and wear. Every answer that is an outfit replaces the cached one, so whichever
 * screen shows it shows the change; the saved list is asked again behind it.
 */
function Actions({ outfit }: OutfitPanelProps) {
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
