import {
  itemTagsSchema,
  readSuggestion,
  SLOTS,
  TYPES_BY_SLOT,
  type ItemColor,
  type Slot,
} from '@closet/core';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useId, useState } from 'react';
import { useNavigate } from 'react-router';
import type { NewItemFields } from './wardrobe.interfaces';
import { createItem } from './wardrobe.api';
import { itemKeys } from './wardrobe.constants';
import { PhotoStep } from './photo-step';
import { ColorList } from './color-list';
import { emptyDraft, tagsFromDraft, withSuggestion } from './tag-form/tag-form.utils';
import { TagForm } from './tag-form/tag-form';
import { usePhoto } from './use-photo';
import { useFlag, useFlagsKnown } from '../flags';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { Field } from '../../shared/ui/field';
import { useFormSubmit } from '../../shared/hooks/use-form-submit';
import { Window } from '../../shared/ui/window';
import { BAD_TAGS, NO_PHOTO } from './wardrobe.constants';
import { describeNewItemFailure } from './wardrobe.utils';

export function NewItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [slot, setSlot] = useState<Slot>('top');
  const slotId = useId();
  const typeId = useId();
  const [draft, setDraft] = useState(emptyDraft);
  // Colors arrive as a suggestion, through the same door the tagger's will in step 15.
  const offerColors = useCallback((colors: ItemColor[]) => {
    setDraft((current) => withSuggestion(current, readSuggestion({ colors })));
  }, []);
  const photo = usePhoto(offerColors, useFlag('photoCutout'));
  const flagsKnown = useFlagsKnown();
  // The photograph is still being worked on: sending now would send it half made.
  const preparing = photo.photo.step === 'reading' || photo.photo.step === 'cutting';
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<NewItemFields>(async (fields) => {
    const images = photo.kept();

    if (images === null) {
      throw NO_PHOTO;
    }

    const tags = tagsFromDraft(draft);

    // Before anything is uploaded: a composition that adds up to 120% should cost a
    // message, not two files nobody will point at.
    if (!itemTagsSchema.safeParse({ slot: fields.slot, type: fields.type, ...tags }).success) {
      throw BAD_TAGS;
    }

    const item = await createItem({ ...fields, ...images, tags });

    // The card has it already, and every list asks again when it is next shown.
    queryClient.setQueryData(itemKeys.one(item.id), item);
    void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });

    // `replace`, so that closing the card goes back to the wardrobe and not to this form.
    await navigate(`/wardrobe/${item.id}`, { replace: true });
  }, describeNewItemFailure);

  return (
    <Window title={uk.newItem.title} parent="/wardrobe">
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <PhotoStep
          photo={photo.photo}
          choosable={flagsKnown}
          useCutout={photo.useCutout}
          onChoose={photo.choose}
          onUseCutout={photo.setUseCutout}
          onTryCutout={photo.tryCutout}
        />
        <div className="field-row-stacked">
          <label htmlFor={slotId}>{uk.newItem.slot}</label>
          <select
            id={slotId}
            name="slot"
            value={slot}
            onChange={(event) => setSlot(event.target.value as Slot)}
          >
            {SLOTS.map((code) => (
              <option key={code} value={code}>
                {uk.slots[code]}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row-stacked">
          <label htmlFor={typeId}>{uk.newItem.type}</label>
          <select id={typeId} name="type">
            {TYPES_BY_SLOT[slot].map((code) => (
              <option key={code} value={code}>
                {uk.types[code]}
              </option>
            ))}
          </select>
        </div>
        <Field label={uk.newItem.name} name="name" type="text" maxLength={80} />
        <ColorList
          colors={draft.colors}
          onRemove={(color) =>
            setDraft({ ...draft, colors: draft.colors.filter((each) => each !== color) })
          }
        />
        <TagForm draft={draft} onChange={setDraft} />
        <button
          type="submit"
          className="action w-full md:w-auto md:self-end"
          disabled={pending || preparing}
        >
          {uk.newItem.submit}
        </button>
      </form>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
    </Window>
  );
}
