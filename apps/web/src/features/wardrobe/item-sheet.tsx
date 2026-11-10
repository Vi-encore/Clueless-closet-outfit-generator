import { Link } from 'react-router';
import type { ItemSheetProps } from './wardrobe.interfaces';
import { TagLines } from './tag-lines';
import { uk } from '../../shared/i18n/uk';
import { Window } from '../../shared/ui/window';
import { ArchiveForm } from './archive-form';
import { ArchivedNote } from './archived-note';
import { SharingSwitch } from './sharing-switch';

export function ItemSheet({ item }: ItemSheetProps) {
  const name = item.name ?? uk.types[item.type];
  const image = item.cutoutUrl ?? item.photoUrl;

  return (
    <Window title={name} parent="/wardrobe" wide>
      <div className="sheet flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {image !== null && (
          <img className="item-photo max-h-[50dvh] w-auto sm:max-w-1/2" src={image} alt={name} />
        )}
        <div className="flex flex-col gap-4 self-stretch sm:flex-1">
          <dl className="details">
            <dt>{uk.item.slot}</dt>
            <dd>{uk.slots[item.slot]}</dd>
            <dt>{uk.item.type}</dt>
            <dd>{uk.types[item.type]}</dd>
            <TagLines item={item} />
            <dt>{uk.item.visibility}</dt>
            <dd>{uk.visibility[item.visibility]}</dd>
          </dl>
          <SharingSwitch item={item} />
          {item.status !== 'archived' && (
            // A path rather than an import: the wardrobe does not reach into the outfits.
            <Link to={`/outfits?with=${item.id}`} className="self-start">
              {uk.item.makeOutfit}
            </Link>
          )}
          {item.status === 'archived' ? <ArchivedNote item={item} /> : <ArchiveForm id={item.id} />}
        </div>
      </div>
    </Window>
  );
}
