import { uk } from '../../shared/i18n/uk';
import { Sheet } from '../../shared/ui/sheet';
import type { CostPerWearProps } from './stats.interfaces';

/**
 * What each wear has cost so far, cheapest first, and what was bought and is still
 * waiting to be worn. Amounts are shown as the API wrote them, with the currency's code:
 * a wardrobe bought in two currencies reads as exactly that.
 */
export function CostPerWear({ costPerWear, unwornWithPrice }: CostPerWearProps) {
  return (
    <>
      {costPerWear.length > 0 && (
        <Sheet title={uk.stats.costPerWear}>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {costPerWear.map(({ item, perWear, currency }) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>{item.name ?? uk.types[item.type]}</span>
                <span className="font-bold whitespace-nowrap">
                  {uk.stats.money(perWear, currency)}
                </span>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
      {unwornWithPrice.length > 0 && (
        <Sheet title={uk.stats.notYetWorn}>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {unwornWithPrice.map(({ item, price, currency }) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>{item.name ?? uk.types[item.type]}</span>
                <span className="whitespace-nowrap">{uk.stats.money(price, currency)}</span>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </>
  );
}
