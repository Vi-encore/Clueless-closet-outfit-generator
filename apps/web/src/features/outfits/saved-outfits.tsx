import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { Window } from '../../shared/ui/window';
import type { Outfit } from './outfits.interfaces';
import { savedOutfitsQuery } from './outfits.queries';

/** When it was saved, or made if it somehow was not. */
function dayOf(outfit: Outfit): string {
  return new Date(outfit.savedAt ?? outfit.createdAt).toLocaleDateString('uk-UA');
}

/** The saved outfits, newest first, each a link to its own screen. */
export function SavedOutfits() {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(savedOutfitsQuery());
  const outfits = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Window title={uk.outfits.saved} parent="/outfits" wide>
      {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
      {data !== undefined && outfits.length === 0 && <p>{uk.outfits.savedEmpty}</p>}
      {outfits.length > 0 && (
        <ul aria-label={uk.outfits.saved} className="m-0 flex list-none flex-col gap-2 p-0">
          {outfits.map((outfit) => (
            <li key={outfit.id}>
              <Link to={`/outfits/${outfit.id}`} className="flex items-center gap-2">
                <span className="flex gap-1" aria-hidden="true">
                  {outfit.items.map((item) => {
                    const image = item.cutoutUrl ?? item.photoUrl;
                    return image === null ? null : (
                      <img key={item.id} src={image} alt="" className="h-12 w-12 object-contain" />
                    );
                  })}
                </span>
                {uk.outfits.savedOutfit(uk.occasions[outfit.occasion], dayOf(outfit))}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {hasNextPage && (
        <button
          type="button"
          className="mt-4 self-start"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {uk.outfits.more}
        </button>
      )}
    </Window>
  );
}
