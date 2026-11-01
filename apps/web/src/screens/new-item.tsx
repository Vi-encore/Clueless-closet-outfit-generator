import { PHOTO_CONTENT_TYPES, SLOTS, TYPES_BY_SLOT, type Slot } from '@closet/core';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { hasStatus } from '../api/api-error';
import type { NewItem as NewItemFields } from '../api/api.interfaces';
import { createItem } from '../api/items';
import { uk } from '../i18n/uk';
import { ErrorDialog } from '../shell/error-dialog';
import { Field } from '../shell/field';
import { useFormSubmit } from '../shell/use-form-submit';
import { Window } from '../shell/window';

/** Thrown here and read back in `describe`, like anything else that stops the form. */
const NO_PHOTO = new Error('No photograph was chosen');

function describe(error: unknown): string {
  if (error === NO_PHOTO) {
    return uk.newItem.noPhoto;
  }

  // The API refuses a content type it does not know, which a file picker's filter does
  // not rule out: most of them let a person choose "all files".
  return hasStatus(error, 400) ? uk.newItem.badPhoto : uk.newItem.failed;
}

/** As the form holds it: a file input can be empty, and `createItem` wants a photograph. */
type FormFields = Omit<NewItemFields, 'photo'> & { photo: File | null };

export function NewItem() {
  const navigate = useNavigate();
  const [slot, setSlot] = useState<Slot>('top');
  const slotId = useId();
  const typeId = useId();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<FormFields>(
    async ({ photo, ...fields }) => {
      if (photo === null) {
        throw NO_PHOTO;
      }

      const item = await createItem({ ...fields, photo });

      // `replace`, so that closing the card goes back to the wardrobe and not to this form.
      await navigate(`/wardrobe/${item.id}`, { replace: true });
    },
    describe,
  );

  return (
    <Window title={uk.newItem.title} parent="/wardrobe">
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
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
        <Field label={uk.newItem.name} name="name" type="text" maxLength={120} />
        <Field
          label={uk.newItem.photo}
          name="photo"
          type="file"
          accept={PHOTO_CONTENT_TYPES.join(',')}
        />
        <button type="submit" className="action w-full md:w-auto md:self-end" disabled={pending}>
          {uk.newItem.submit}
        </button>
      </form>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
    </Window>
  );
}
