import { uk } from '../../shared/i18n/uk';
import type { WornBarsProps } from './stats.interfaces';
import { ItemThumb } from './item-thumb';
import { barPercent } from './stats.utils';

/**
 * The most worn items as bars, the most worn full and the rest by their share of it. The
 * bar is a picture of the number written beside it, and hidden from a screen reader.
 */
export function WornBars({ items }: WornBarsProps) {
  const longest = items[0]?.wearCount ?? 0;

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) => {
        return (
          <li key={item.id} className="worn-row">
            <ItemThumb item={item} />
            <span className="break-words">{item.name ?? uk.types[item.type]}</span>
            <div className="segmented-bar" aria-hidden="true">
              <span style={{ width: `${barPercent(item.wearCount, longest)}%` }} />
            </div>
            <span className="text-right whitespace-nowrap">{uk.stats.times(item.wearCount)}</span>
          </li>
        );
      })}
    </ul>
  );
}
