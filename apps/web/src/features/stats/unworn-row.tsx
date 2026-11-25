import { ARCHIVE_REASONS, type ArchiveReason } from '@closet/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { ItemTile, archiveItem, itemKeys } from '../wardrobe';
import { statsKeys } from './stats.constants';
import type { UnwornPages, UnwornRowProps } from './stats.interfaces';
import { dayOf, withoutLine } from './stats.utils';

/**
 * One item not worn for a while: a link to its card, when it was last worn, and archiving
 * it right here. Archiving asks why, as the card does, and sends nothing without a reason:
 * the statistics count how clothes really end.
 */
export function UnwornRow({ line }: UnwornRowProps) {
  const { item, lastWornAt } = line;
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState<ArchiveReason | ''>('');
  const [missing, setMissing] = useState(false);
  const archiving = useMutation({
    mutationFn: (chosen: ArchiveReason) => archiveItem(item.id, chosen),
    onSuccess: (archived) => {
      queryClient.setQueryData(itemKeys.one(item.id), archived);
      queryClient.setQueriesData<UnwornPages>(
        { queryKey: [...statsKeys.all, 'unworn'] },
        withoutLine(item.id),
      );
      void queryClient.invalidateQueries({ queryKey: statsKeys.summary() });
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });

  const archive = () => {
    if (reason === '') {
      setMissing(true);
      return;
    }

    archiving.mutate(reason);
  };

  return (
    <li className="flex flex-col gap-2">
      <Link to={`/wardrobe/${item.id}`} className="item-tile block text-inherit no-underline">
        <ItemTile item={item} />
      </Link>
      <span>{lastWornAt === null ? uk.stats.neverWorn : uk.stats.lastWorn(dayOf(lastWornAt))}</span>
      {asking ? (
        <div className="well flex flex-col gap-2">
          <div className="field-row-stacked">
            <label htmlFor={reasonId}>{uk.item.reason}</label>
            <select
              id={reasonId}
              value={reason}
              onChange={(event) => {
                setReason(ARCHIVE_REASONS.find((code) => code === event.target.value) ?? '');
                setMissing(false);
              }}
            >
              <option value="">{uk.item.chooseReason}</option>
              {ARCHIVE_REASONS.map((code) => (
                <option key={code} value={code}>
                  {uk.archiveReasons[code]}
                </option>
              ))}
            </select>
          </div>
          {missing && <p role="alert">{uk.item.noReason}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="danger"
              disabled={archiving.isPending}
              onClick={archive}
            >
              {uk.stats.archive}
            </button>
            <button type="button" onClick={() => setAsking(false)}>
              {uk.dialog.cancel}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="secondary self-start" onClick={() => setAsking(true)}>
          {uk.stats.toArchive}
        </button>
      )}
      {archiving.isError && (
        <ErrorDialog message={uk.errors.unavailable} onClose={() => archiving.reset()} />
      )}
    </li>
  );
}
