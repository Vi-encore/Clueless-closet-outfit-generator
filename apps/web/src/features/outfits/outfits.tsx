import { OCCASIONS, type OccasionCode } from '@closet/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { Window } from '../../shared/ui/window';
import { OutfitPanel } from './outfit-panel';
import { generateOutfit } from './outfits.api';
import type { GenerateAnswer, ShownOutfitProps } from './outfits.interfaces';
import { outfitKeys, outfitQuery } from './outfits.queries';

const DEFAULT_OCCASION: OccasionCode = 'casual';

function occasionFrom(value: string | null): OccasionCode {
  return OCCASIONS.find((code) => code === value) ?? DEFAULT_OCCASION;
}

/**
 * Pick an occasion, get an outfit. `?occasion=` keeps the choice and `?with=` an item every
 * outfit must hold. `seen` is every outfit shown on this screen since the occasion was
 * chosen, so "another one" is always another one.
 */
export function Outfits() {
  const selectId = useId();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const occasion = occasionFrom(params.get('occasion'));
  const around = params.get('with');
  const [shownId, setShownId] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [nothing, setNothing] = useState(false);

  const generation = useMutation({
    mutationFn: generateOutfit,
    onSuccess: ({ outfit }: GenerateAnswer) => {
      setNothing(outfit === null);
      setShownId(outfit?.id ?? null);

      if (outfit !== null) {
        queryClient.setQueryData(outfitKeys.one(outfit.id), outfit);
        setSeen((earlier) => [...earlier, outfit.id]);
      }
    },
  });
  const { mutate } = generation;

  const ask = () =>
    mutate({
      occasion,
      ...(around === null ? {} : { mustInclude: [around] }),
      ...(seen.length === 0 ? {} : { seen }),
    });

  // Arriving from an item's card asks at once, and only once per item: StrictMode runs an
  // effect twice, and a second request would make and store a second outfit.
  const askedAround = useRef<string | null>(null);
  useEffect(() => {
    if (around !== null && askedAround.current !== around) {
      askedAround.current = around;
      mutate({ occasion, mustInclude: [around] });
    }
  }, [around, occasion, mutate]);

  const choose = (code: OccasionCode) => {
    const next = new URLSearchParams(params);
    next.set('occasion', code);
    setParams(next, { replace: true });
    setSeen([]);
    setShownId(null);
    setNothing(false);
  };

  return (
    <Window title={uk.outfits.title} parent="/" wide>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="field-row-stacked">
            <label htmlFor={selectId}>{uk.outfits.occasion}</label>
            <select
              id={selectId}
              value={occasion}
              onChange={(event) => choose(occasionFrom(event.target.value))}
            >
              {OCCASIONS.map((code) => (
                <option key={code} value={code}>
                  {uk.occasions[code]}
                </option>
              ))}
            </select>
          </div>
          <button type="button" disabled={generation.isPending} onClick={ask}>
            {shownId === null ? uk.outfits.make : uk.outfits.another}
          </button>
          <Link to="/outfits/saved" className="ml-auto">
            {uk.outfits.toSaved}
          </Link>
        </div>
        {nothing && <p>{around === null ? uk.outfits.nothing : uk.outfits.nothingAround}</p>}
        {shownId !== null && <ShownOutfit id={shownId} />}
        {generation.isError && (
          <ErrorDialog message={uk.errors.unavailable} onClose={() => generation.reset()} />
        )}
      </div>
    </Window>
  );
}

/** Read from the cache, where generating put it and where liking and saving update it. */
function ShownOutfit({ id }: ShownOutfitProps) {
  const { data: outfit } = useQuery(outfitQuery(id));

  return outfit === undefined ? null : <OutfitPanel outfit={outfit} />;
}
