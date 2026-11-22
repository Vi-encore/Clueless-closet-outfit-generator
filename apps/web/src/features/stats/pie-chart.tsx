import type { PieChartProps } from './stats.interfaces';
import { pieGradient, sectorsOf } from './stats.utils';

/**
 * A pie chart drawn by CSS alone: one `conic-gradient`, a sector per slice. Its heading is
 * the sheet's it stands in; `label` names the figure for a screen reader. The picture is
 * hidden from a screen reader, since the legend beside it says the same in words and
 * numbers, and a sliver too thin to see is still a line there.
 */
export function PieChart({ label, slices }: PieChartProps) {
  const background = pieGradient(
    sectorsOf(slices.map(({ count }) => count)),
    slices.map(({ colour }) => colour),
  );

  return (
    <figure aria-label={label} className="pie-chart m-0 flex flex-col items-center gap-3">
      <div className="pie" aria-hidden="true" style={{ background }} />
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {slices.map(({ key, label: name, count, colour }) => (
          <li key={key} className="flex items-center gap-2">
            <span className="swatch" style={{ backgroundColor: colour }} />
            <span>{name}</span>
            <span className="font-bold">{count}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
