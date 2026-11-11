import { Doll } from './doll/doll';
import type { OutfitPanelProps } from './outfits.interfaces';
import { OutfitReason } from './outfit-reason';
import { OutfitActions } from './outfit-actions';

/** The outfit on the doll, why it was chosen, and what can be done with it. */
export function OutfitPanel({ outfit }: OutfitPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="w-full sm:w-1/2">
        <Doll items={outfit.items} />
      </div>
      <div className="flex flex-col gap-4 self-stretch sm:flex-1">
        <OutfitReason outfit={outfit} />
        <OutfitActions outfit={outfit} />
      </div>
    </div>
  );
}
