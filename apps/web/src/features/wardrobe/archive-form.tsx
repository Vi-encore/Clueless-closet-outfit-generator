import { ARCHIVE_REASONS } from '@closet/core';
import { useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import type { ArchiveFields, ArchiveFormProps } from './wardrobe.interfaces';
import { archiveItem } from './wardrobe.api';
import { withoutItem } from './wardrobe.queries';
import { itemKeys } from './wardrobe.constants';
import type { ItemPages } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { useClose } from '../../shared/hooks/use-close';
import { useFormSubmit } from '../../shared/hooks/use-form-submit';
import { NO_REASON } from './wardrobe.constants';
import { describeArchiveFailure } from './wardrobe.utils';

export function ArchiveForm({ id }: ArchiveFormProps) {
  const close = useClose('/wardrobe');
  const queryClient = useQueryClient();
  const reasonId = useId();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<ArchiveFields>(
    async ({ reason }) => {
      // No default on purpose: the statistics count how clothes really end, and a
      // reason nobody chose would look exactly like one somebody did.
      if (reason === '') {
        throw NO_REASON;
      }

      const archived = await archiveItem(id, reason);

      // Gone from every list at once, and the lists asked again behind that.
      queryClient.setQueryData(itemKeys.one(id), archived);
      queryClient.setQueriesData<ItemPages>({ queryKey: itemKeys.lists() }, withoutItem(id));
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      close();
    },
    describeArchiveFailure,
  );

  return (
    <form className="well flex flex-col gap-2" onSubmit={onSubmit}>
      <p>{uk.item.archiveNote}</p>
      <div className="field-row-stacked">
        <label htmlFor={reasonId}>{uk.item.reason}</label>
        <select id={reasonId} name="reason" defaultValue="">
          <option value="">{uk.item.chooseReason}</option>
          {ARCHIVE_REASONS.map((code) => (
            <option key={code} value={code}>
              {uk.archiveReasons[code]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="self-start" disabled={pending}>
        {uk.item.archive}
      </button>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
    </form>
  );
}
