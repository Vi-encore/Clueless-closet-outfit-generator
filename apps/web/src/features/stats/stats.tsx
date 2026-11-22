import { COLOR_SWATCHES } from '@closet/core';
import { useQuery } from '@tanstack/react-query';
import { uk } from '../../shared/i18n/uk';
import { Sheet } from '../../shared/ui/sheet';
import { Window } from '../../shared/ui/window';
import { PieChart } from './pie-chart';
import { NO_COLOUR, SLOT_COLOURS } from './stats.constants';
import { summaryQuery } from './stats.queries';
import { percentOf } from './stats.utils';

/** The wardrobe in numbers: how much of it is worn, and what it is made of. */
export function Stats() {
  const { data, error } = useQuery(summaryQuery());

  return (
    <Window title={uk.stats.title} parent="/" wide>
      {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
      {data !== undefined && data.items === 0 && <p>{uk.stats.empty}</p>}
      {data !== undefined && data.items > 0 && (
        <div className="flex flex-col gap-6">
          <p className="stats-headline m-0">
            {uk.stats.worn(data.worn, data.items, percentOf(data.worn, data.items))}
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <Sheet title={uk.stats.bySlot}>
              <PieChart
                label={uk.stats.bySlot}
                slices={data.bySlot.map(({ slot, count }) => ({
                  key: slot,
                  label: uk.slots[slot],
                  count,
                  colour: SLOT_COLOURS[slot],
                }))}
              />
            </Sheet>
            <Sheet title={uk.stats.byColor}>
              <PieChart
                label={uk.stats.byColor}
                slices={data.byColor.map(({ family, count }) => ({
                  key: family ?? 'none',
                  label: family === null ? uk.stats.noColors : uk.colors[family],
                  count,
                  colour: family === null ? NO_COLOUR : COLOR_SWATCHES[family],
                }))}
              />
            </Sheet>
          </div>
        </div>
      )}
    </Window>
  );
}
