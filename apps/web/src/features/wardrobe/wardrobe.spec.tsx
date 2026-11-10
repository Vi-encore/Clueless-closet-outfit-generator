import {
  ARCHIVE_REASONS,
  COLOR_FAMILIES,
  FABRIC_TYPES,
  FITS,
  ITEM_TYPES,
  LENGTHS,
  MATERIALS,
  OCCASIONS,
  PATTERNS,
  readSuggestion,
  RISES,
  SEASONS,
  SLOTS,
  STYLES,
  TYPES_BY_SLOT,
  VISIBILITIES,
} from '@closet/core';
import { render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uk } from '../../shared/i18n/uk';
import { anItem, signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import type { HasSlot, Seen } from '../../../test/test.interfaces';
import { colorsOf, cutOut, readPhoto } from './photo/prepare';
import { UNREADABLE_PHOTO } from './photo/photo.constants';
import { emptyDraft, withSuggestion } from './tag-form/tag-form.utils';
import { TagForm } from './tag-form/tag-form';
import type { Item } from './wardrobe.interfaces';

const wardrobe = () => screen.findByRole('region', { name: uk.wardrobe.title });

// The photo pipeline needs a canvas and a model, and jsdom has neither. What it does to
// pixels is checked in `photo.spec.ts` and on a phone; here it answers as it would.
vi.mock('./photo/prepare', () => ({
  UNREADABLE_PHOTO: new Error('unreadable'),
  readPhoto: vi.fn(),
  cutOut: vi.fn(),
  colorsOf: vi.fn(),
}));

const ORIGINAL = new Blob(['the whole photograph'], { type: 'image/webp' });
const CUTOUT = new Blob(['the item alone'], { type: 'image/webp' });

beforeEach(() => {
  vi.mocked(readPhoto).mockResolvedValue({
    image: { close: () => {} } as ImageBitmap,
    original: ORIGINAL,
  });
  vi.mocked(cutOut).mockResolvedValue(CUTOUT);
  vi.mocked(colorsOf).mockResolvedValue([]);
});

const UPLOAD = 'https://storage.test/upload';

/** The key the API hands out with its nth upload URL. */
const keyOf = (n: number) => `items/owner/${n}.webp`;

/** Records what reaches the API and storage, and answers as both would. */
function apiAndStorageWork() {
  const seen: Seen = { uploads: [], created: [] };
  let issued = 0;

  signedIn();
  server.use(
    http.post(`${API}/items/upload-url`, () => {
      issued += 1;

      return HttpResponse.json({ key: keyOf(issued), url: `${UPLOAD}/${issued}` });
    }),
    http.put(`${UPLOAD}/:n`, async ({ request }) => {
      seen.uploads.push({
        contentType: request.headers.get('Content-Type'),
        authorization: request.headers.get('Authorization'),
        size: (await request.arrayBuffer()).byteLength,
      });

      return new HttpResponse(null, { status: 200 });
    }),
    http.post(`${API}/items`, async ({ request }) => {
      seen.created.push((await request.json()) as object);

      return HttpResponse.json(anItem({ id: 'new-item', name: 'Added' }), { status: 201 });
    }),
    http.get(`${API}/items/new-item`, () =>
      HttpResponse.json(anItem({ id: 'new-item', name: 'Added' })),
    ),
  );

  return seen;
}

/** Picks a photograph from the gallery, and waits until the form has done with it. */
async function choosePhoto(person: ReturnType<typeof userEvent.setup>) {
  const photo = new File(['bytes of a photograph'], 'blazer.jpg', { type: 'image/jpeg' });

  await person.upload(await screen.findByLabelText(uk.newItem.gallery), photo);
  await expect.poll(() => screen.queryByText(uk.newItem.preparing)).toBeNull();
  await expect.poll(() => screen.queryByText(uk.newItem.cuttingOut)).toBeNull();
}

/** A wardrobe of one page: whatever is passed, whatever is asked. */
function theWardrobeHolds(...items: object[]) {
  server.use(http.get(`${API}/items`, () => HttpResponse.json({ items, nextCursor: null })));
}

/** Answers by slot, the way the API narrows a list. */
function theApiFiltersBySlot(...items: HasSlot[]) {
  server.use(
    http.get(`${API}/items`, ({ request }) => {
      const slot = new URL(request.url).searchParams.get('slot');

      return HttpResponse.json({
        items: items.filter((item) => slot === null || item.slot === slot),
        nextCursor: null,
      });
    }),
  );
}

describe('Requirement: The wardrobe shows your things', () => {
  it('Scenario: The desktop opens the wardrobe', async () => {
    const person = userEvent.setup();
    signedIn();
    theWardrobeHolds();
    renderApp('/');

    await person.click(await screen.findByRole('link', { name: uk.wardrobe.title }));

    expect(await wardrobe()).toBeInTheDocument();
  });

  it('Scenario: The wardrobe leads back to the desktop', async () => {
    const person = userEvent.setup();
    signedIn();
    theWardrobeHolds();
    renderApp('/wardrobe');

    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    expect(await screen.findByRole('region', { name: uk.desktop.title })).toBeInTheDocument();
  });

  it('Scenario: Items are shown with their photographs', async () => {
    signedIn();
    theWardrobeHolds(anItem({ name: 'Plaid blazer', photoUrl: 'https://photos.test/blazer.webp' }));

    renderApp('/wardrobe');

    expect(await screen.findByRole('img', { name: 'Plaid blazer' })).toHaveAttribute(
      'src',
      'https://photos.test/blazer.webp',
    );
    expect(screen.getByText('Plaid blazer')).toBeInTheDocument();
  });

  it('Scenario: An item without a photo is still shown', async () => {
    signedIn();
    theWardrobeHolds(anItem({ slot: 'shoes', type: 'loafers', name: null, photoUrl: null }));

    renderApp('/wardrobe');

    expect(await screen.findByText(uk.types.loafers)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('Scenario: An empty wardrobe says so', async () => {
    signedIn();
    theWardrobeHolds();

    renderApp('/wardrobe');

    expect(await screen.findByText(uk.wardrobe.empty)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('Requirement: The wardrobe is read a page at a time', () => {
  it('Scenario: More can be asked for', async () => {
    const person = userEvent.setup();
    const first = anItem({ id: 'first', name: 'First' });
    const second = anItem({ id: 'second', name: 'Second' });
    signedIn();
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');

        return HttpResponse.json(
          cursor === 'first'
            ? { items: [second], nextCursor: null }
            : { items: [first], nextCursor: 'first' },
        );
      }),
    );
    renderApp('/wardrobe');

    await person.click(await screen.findByRole('button', { name: uk.wardrobe.more }));

    await screen.findByText('Second');
    const shown = within(screen.getByRole('list', { name: uk.wardrobe.title }));
    expect(shown.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('Scenario: The end offers nothing', async () => {
    signedIn();
    theWardrobeHolds(anItem({ name: 'Only' }));

    renderApp('/wardrobe');

    await screen.findByText('Only');
    expect(screen.queryByRole('button', { name: uk.wardrobe.more })).not.toBeInTheDocument();
  });
});

describe('Requirement: The wardrobe can be narrowed by slot', () => {
  it('Scenario: A slot narrows the list', async () => {
    const person = userEvent.setup();
    signedIn();
    theApiFiltersBySlot(
      anItem({ id: 'a', slot: 'shoes', type: 'loafers', name: 'Loafers' }),
      anItem({ id: 'b', slot: 'top', type: 'blouse', name: 'Blouse' }),
    );
    renderApp('/wardrobe');
    await screen.findByText('Blouse');

    await person.selectOptions(screen.getByLabelText(uk.wardrobe.slot), uk.slots.shoes);

    await screen.findByText('Loafers');
    await expect(screen.findByText('Blouse', {}, { timeout: 50 })).rejects.toThrow();
  });

  it('Scenario: The choice survives in the URL', async () => {
    const asked: Array<string | null> = [];
    signedIn();
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        asked.push(new URL(request.url).searchParams.get('slot'));

        return HttpResponse.json({ items: [], nextCursor: null });
      }),
    );

    renderApp('/wardrobe?slot=shoes');

    expect(await screen.findByLabelText(uk.wardrobe.slot)).toHaveValue('shoes');
    await screen.findByText(uk.wardrobe.empty);
    expect(new Set(asked)).toEqual(new Set(['shoes']));
  });

  it('Scenario: A late answer changes nothing', async () => {
    const person = userEvent.setup();
    const { promise: shoesMayAnswer, resolve: letShoesAnswer } = Promise.withResolvers<void>();
    let answeredShoes = false;
    signedIn();
    server.use(
      http.get(`${API}/items`, async ({ request }) => {
        const slot = new URL(request.url).searchParams.get('slot');

        if (slot === 'shoes') {
          await shoesMayAnswer;
          answeredShoes = true;
        }

        return HttpResponse.json({
          items: slot === null ? [] : [anItem({ id: slot, name: `Only ${slot}` })],
          nextCursor: null,
        });
      }),
    );
    renderApp('/wardrobe');
    const filter = await screen.findByLabelText(uk.wardrobe.slot);

    await person.selectOptions(filter, uk.slots.shoes);
    await person.selectOptions(filter, uk.slots.top);
    await screen.findByText('Only top');
    letShoesAnswer();
    await expect.poll(() => answeredShoes).toBe(true);

    await expect(screen.findByText('Only shoes', {}, { timeout: 50 })).rejects.toThrow();
    expect(screen.getByText('Only top')).toBeInTheDocument();
  });
});

describe('Requirement: An item can be added with a photograph', () => {
  it('Scenario: The types follow the slot', async () => {
    const person = userEvent.setup();
    signedIn();
    renderApp('/wardrobe/new');
    const slot = await screen.findByLabelText(uk.newItem.slot);
    const type = screen.getByLabelText(uk.newItem.type);
    await person.selectOptions(type, uk.types.hoodie);

    await person.selectOptions(slot, uk.slots.shoes);

    expect(
      within(type)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(TYPES_BY_SLOT.shoes.map((code) => uk.types[code]));
    // Nothing resets this by hand. Its chosen option is gone, so the browser moves to the
    // first one, and the pair sent to the API cannot be a hoodie among the shoes.
    expect(type).toHaveValue(TYPES_BY_SLOT.shoes[0]);
  });

  it('Scenario: The camera and the gallery are both offered', async () => {
    signedIn();

    renderApp('/wardrobe/new');

    const camera = await screen.findByLabelText(uk.newItem.camera);
    const gallery = screen.getByLabelText(uk.newItem.gallery);
    expect(camera).toHaveAttribute('capture', 'environment');
    expect(camera).toHaveAttribute('type', 'file');
    expect(gallery).not.toHaveAttribute('capture');
    expect(gallery).toHaveAttribute('type', 'file');
  });

  it('Scenario: An item is added with its photograph', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    renderApp('/wardrobe/new');

    await person.selectOptions(await screen.findByLabelText(uk.newItem.slot), uk.slots.shoes);
    await person.selectOptions(screen.getByLabelText(uk.newItem.type), uk.types.loafers);
    await person.type(screen.getByLabelText(uk.newItem.name), 'Added');
    await choosePhoto(person);
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.uploads[0]).toEqual({
      contentType: 'image/webp',
      authorization: null,
      size: ORIGINAL.size,
    });
    expect(seen.created[0]).toMatchObject({
      slot: 'shoes',
      type: 'loafers',
      name: 'Added',
      photoOriginalKey: keyOf(1),
    });
  });

  it('Scenario: A photograph is required', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    renderApp('/wardrobe/new');

    await person.click(await screen.findByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.newItem.noPhoto);
    expect(screen.getByRole('region', { name: uk.newItem.title })).toBeInTheDocument();
    expect(seen.uploads).toEqual([]);
    expect(seen.created).toEqual([]);
  });

  it('Scenario: A file that is not a readable image is refused', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    vi.mocked(readPhoto).mockRejectedValue(UNREADABLE_PHOTO);
    renderApp('/wardrobe/new');

    await choosePhoto(person);

    expect(await screen.findByRole('alert')).toHaveTextContent(uk.newItem.unreadable);

    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.newItem.noPhoto);
    expect(seen.uploads).toEqual([]);
    expect(seen.created).toEqual([]);
  });

  it('Scenario: A failed upload creates nothing', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    server.use(http.put(`${UPLOAD}/:n`, () => new HttpResponse(null, { status: 403 })));
    renderApp('/wardrobe/new');

    await choosePhoto(person);
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.newItem.failed);
    expect(seen.created).toEqual([]);
  });
});

describe('Requirement: Background removal can be switched off', () => {
  /** A deployment that switched the cut-out off. */
  function theCutOutIsOff() {
    server.use(http.get(`${API}/flags`, () => HttpResponse.json({ photoCutout: false })));
  }

  it('Scenario: Switched off, the original is used', async () => {
    const person = userEvent.setup();
    apiAndStorageWork();
    theCutOutIsOff();
    renderApp('/wardrobe/new');

    await choosePhoto(person);

    expect(await screen.findByRole('img', { name: uk.newItem.originalAlt })).toBeInTheDocument();
    expect(screen.queryByText(uk.newItem.cutFailed)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: uk.newItem.useCutout })).not.toBeInTheDocument();
    // What cutting out needs is fetched by `cutOut`, so not calling it is not fetching it.
    expect(vi.mocked(cutOut)).not.toHaveBeenCalled();
  });

  it('Scenario: Switched off, only the original is sent', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    theCutOutIsOff();
    renderApp('/wardrobe/new');
    await choosePhoto(person);

    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.uploads.map(({ size }) => size)).toEqual([ORIGINAL.size]);
    expect(seen.created[0]).not.toHaveProperty('photoCutoutKey');
  });
});

describe('Requirement: The background is cut out before saving', () => {
  it('Scenario: The cut-out is shown for approval', async () => {
    const person = userEvent.setup();
    apiAndStorageWork();
    renderApp('/wardrobe/new');

    await choosePhoto(person);

    expect(await screen.findByRole('img', { name: uk.newItem.cutoutAlt })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: uk.newItem.useCutout })).toBeChecked();
  });

  it('Scenario: Both images are kept', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    renderApp('/wardrobe/new');

    await choosePhoto(person);
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.uploads.map(({ size }) => size)).toEqual([ORIGINAL.size, CUTOUT.size]);
    expect(seen.created[0]).toMatchObject({
      photoOriginalKey: keyOf(1),
      photoCutoutKey: keyOf(2),
    });
  });

  it('Scenario: Declining keeps the original alone', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    renderApp('/wardrobe/new');
    await choosePhoto(person);

    await person.click(screen.getByRole('checkbox', { name: uk.newItem.useCutout }));
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.uploads.map(({ size }) => size)).toEqual([ORIGINAL.size]);
    expect(seen.created[0]).not.toHaveProperty('photoCutoutKey');
  });

  it('Scenario: A failed cut-out does not stop the item', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    vi.mocked(cutOut).mockRejectedValue(new Error('the model ran out of memory'));
    renderApp('/wardrobe/new');

    await choosePhoto(person);

    expect(await screen.findByText(uk.newItem.cutFailed)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: uk.newItem.useCutout })).not.toBeInTheDocument();

    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.created[0]).toMatchObject({ photoOriginalKey: keyOf(1) });
    expect(seen.created[0]).not.toHaveProperty('photoCutoutKey');
  });

  it('Scenario: The wardrobe shows the cut-out', async () => {
    signedIn();
    theWardrobeHolds(
      anItem({
        name: 'Blazer',
        photoUrl: 'https://storage.test/whole.webp',
        cutoutUrl: 'https://storage.test/cut.webp',
      }),
    );

    renderApp('/wardrobe');

    expect(await screen.findByRole('img', { name: 'Blazer' })).toHaveAttribute(
      'src',
      'https://storage.test/cut.webp',
    );
  });
});

describe('Requirement: Colors are offered from the photograph', () => {
  const RED = { family: 'red', hex: '#c81e23', share: 0.7 } as const;
  const WHITE = { family: 'white', hex: '#f5f5f2', share: 0.3 } as const;

  it('Scenario: Colors appear once the photograph is ready', async () => {
    const person = userEvent.setup();
    apiAndStorageWork();
    vi.mocked(colorsOf).mockResolvedValue([RED]);
    renderApp('/wardrobe/new');

    await choosePhoto(person);

    const colors = await screen.findByRole('list', { name: uk.newItem.colors });
    expect(within(colors).getByText(uk.colors.red)).toBeInTheDocument();
    expect(vi.mocked(colorsOf)).toHaveBeenCalledWith(CUTOUT);
  });

  it('Scenario: A color can be removed', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    vi.mocked(colorsOf).mockResolvedValue([RED, WHITE]);
    renderApp('/wardrobe/new');
    await choosePhoto(person);

    await person.click(
      await screen.findByRole('button', { name: uk.newItem.removeColor(uk.colors.red) }),
    );
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.created[0]).toMatchObject({ colors: [WHITE] });
  });
});

describe("Requirement: An item's card says what it is", () => {
  const skirt = anItem({ id: 'skirt', slot: 'bottom', type: 'skirt', name: 'Skirt' });

  function theApiHoldsTheSkirt() {
    signedIn();
    theApiFiltersBySlot(skirt);
    server.use(http.get(`${API}/items/skirt`, () => HttpResponse.json(skirt)));
  }

  it('Scenario: The card names the item in Ukrainian', async () => {
    theApiHoldsTheSkirt();

    renderApp('/wardrobe/skirt');

    expect(await screen.findByRole('region', { name: 'Skirt' })).toBeInTheDocument();
    expect(screen.getByText(uk.slots.bottom)).toBeInTheDocument();
    expect(screen.getByText(uk.types.skirt)).toBeInTheDocument();
  });

  it("Scenario: Somebody else's item is simply not there", async () => {
    signedIn();
    server.use(http.get(`${API}/items/hers`, () => new HttpResponse(null, { status: 404 })));

    renderApp('/wardrobe/hers');

    expect(await screen.findByRole('region', { name: uk.notFound.title })).toBeInTheDocument();
  });

  it('Scenario: The card leads back to where the person was', async () => {
    const person = userEvent.setup();
    theApiHoldsTheSkirt();
    renderApp('/wardrobe?slot=bottom');
    await person.click(await screen.findByRole('link', { name: 'Skirt' }));

    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    expect(await screen.findByLabelText(uk.wardrobe.slot)).toHaveValue('bottom');
  });

  it('Scenario: A card opened directly still leads to the wardrobe', async () => {
    const person = userEvent.setup();
    theApiHoldsTheSkirt();
    renderApp('/wardrobe/skirt');

    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    expect(await wardrobe()).toBeInTheDocument();
  });
});

describe('Requirement: An item can be shared or kept private', () => {
  it('Scenario: Sharing an item', async () => {
    const person = userEvent.setup();
    const item = anItem({ id: 'blazer', name: 'Blazer', visibility: 'private' });
    const patches: object[] = [];
    signedIn();
    server.use(
      http.get(`${API}/items/blazer`, () => HttpResponse.json(item)),
      http.patch(`${API}/items/blazer`, async ({ request }) => {
        patches.push((await request.json()) as object);

        return HttpResponse.json({ ...item, visibility: 'friends' });
      }),
    );
    renderApp('/wardrobe/blazer');
    expect(await screen.findByText(uk.visibility.private)).toBeInTheDocument();

    await person.click(screen.getByRole('checkbox', { name: uk.item.share }));

    expect(await screen.findByText(uk.visibility.friends)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: uk.item.share })).toBeChecked();
    expect(patches).toEqual([{ visibility: 'friends' }]);
  });
});

describe('Requirement: An item can be archived', () => {
  it('Scenario: Archiving asks why', async () => {
    const person = userEvent.setup();
    const item = anItem({ id: 'blazer', name: 'Blazer' });
    const reasons: Array<string | null> = [];
    signedIn();
    theWardrobeHolds();
    server.use(
      http.get(`${API}/items/blazer`, () => HttpResponse.json(item)),
      http.delete(`${API}/items/blazer`, ({ request }) => {
        reasons.push(new URL(request.url).searchParams.get('reason'));

        return HttpResponse.json({ ...item, status: 'archived' });
      }),
    );
    renderApp('/wardrobe/blazer');
    const archive = await screen.findByRole('button', { name: uk.item.archive });

    await person.click(archive);

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent(uk.item.noReason);
    expect(reasons).toEqual([]);

    await person.click(within(dialog).getByRole('button', { name: uk.dialog.ok }));
    await person.selectOptions(screen.getByLabelText(uk.item.reason), uk.archiveReasons.given_away);
    await person.click(archive);

    expect(await wardrobe()).toBeInTheDocument();
    expect(reasons).toEqual(['given_away']);
  });

  it('Scenario: Archiving returns to where the person was', async () => {
    const person = userEvent.setup();
    const coat = anItem({ id: 'coat', slot: 'outerwear', type: 'coat', name: 'Coat' });
    signedIn();
    theApiFiltersBySlot(coat);
    server.use(
      http.get(`${API}/items/coat`, () => HttpResponse.json(coat)),
      http.delete(`${API}/items/coat`, () => HttpResponse.json({ ...coat, status: 'archived' })),
    );
    renderApp('/wardrobe?slot=outerwear');
    await person.click(await screen.findByRole('link', { name: 'Coat' }));
    await person.selectOptions(
      await screen.findByLabelText(uk.item.reason),
      uk.archiveReasons.sold,
    );

    await person.click(screen.getByRole('button', { name: uk.item.archive }));

    expect(await screen.findByLabelText(uk.wardrobe.slot)).toHaveValue('outerwear');
  });
});

describe('Requirement: Archived items can be looked at', () => {
  /** Answers by status and slot, the way the API narrows a list, and notes what was asked. */
  function theApiFiltersByStatus(...items: Item[]) {
    const asked: string[] = [];
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        const query = new URL(request.url).searchParams;
        const status = query.get('status');
        const slot = query.get('slot');
        asked.push(`${status ?? '-'}/${slot ?? '-'}`);

        return HttpResponse.json({
          items: items.filter(
            (item) =>
              (status === null ? item.status !== 'archived' : item.status === status) &&
              (slot === null || item.slot === slot),
          ),
          nextCursor: null,
        });
      }),
    );

    return asked;
  }

  it('Scenario: The archive lists archived items', async () => {
    const person = userEvent.setup();
    signedIn();
    const asked = theApiFiltersByStatus(
      anItem({ id: 'a', name: 'Kept' }),
      anItem({ id: 'b', name: 'Gone', status: 'archived', archivedReason: 'sold' }),
    );
    renderApp('/wardrobe');
    await screen.findByText('Kept');

    await person.selectOptions(screen.getByLabelText(uk.wardrobe.show), uk.wardrobe.archive);

    await screen.findByText('Gone');
    expect(screen.queryByText('Kept')).not.toBeInTheDocument();
    expect(asked).toContain('archived/-');
  });

  it('Scenario: The archive and a slot combine', async () => {
    signedIn();
    const asked = theApiFiltersByStatus();

    renderApp('/wardrobe?status=archived&slot=shoes');

    expect(await screen.findByLabelText(uk.wardrobe.show)).toHaveValue('archived');
    expect(screen.getByLabelText(uk.wardrobe.slot)).toHaveValue('shoes');
    await screen.findByText(uk.wardrobe.archiveEmpty);
    expect(new Set(asked)).toEqual(new Set(['archived/shoes']));
  });

  it('Scenario: An empty archive says so', async () => {
    const person = userEvent.setup();
    signedIn();
    theApiFiltersByStatus(anItem({ id: 'a', name: 'Kept' }));
    renderApp('/wardrobe');
    await screen.findByText('Kept');

    await person.selectOptions(screen.getByLabelText(uk.wardrobe.show), uk.wardrobe.archive);

    expect(await screen.findByText(uk.wardrobe.archiveEmpty)).toBeInTheDocument();
    expect(screen.queryByText(uk.wardrobe.empty)).not.toBeInTheDocument();
  });
});

describe('Requirement: An archived item can be put back', () => {
  const archived = anItem({
    id: 'scarf',
    name: 'Scarf',
    slot: 'accessory',
    type: 'scarf',
    status: 'archived',
    archivedAt: '2026-11-02T10:00:00.000Z',
    archivedReason: 'given_away',
  });

  const archivedLine = uk.item.archived(
    new Date('2026-11-02T10:00:00.000Z').toLocaleDateString('uk-UA'),
    uk.archiveReasons.given_away,
  );

  it('Scenario: An archived card says why it left', async () => {
    signedIn();
    server.use(http.get(`${API}/items/scarf`, () => HttpResponse.json(archived)));

    renderApp('/wardrobe/scarf');

    expect(await screen.findByText(archivedLine)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: uk.item.archive })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: uk.item.restore })).toBeInTheDocument();
  });

  it('Scenario: Putting it back', async () => {
    const person = userEvent.setup();
    const back = { ...archived, status: 'available', archivedAt: null, archivedReason: null };
    let restored = false;
    signedIn();
    server.use(
      http.get(`${API}/items/scarf`, () => HttpResponse.json(restored ? back : archived)),
      http.post(`${API}/items/scarf/restore`, () => {
        restored = true;

        return HttpResponse.json(back);
      }),
      http.get(`${API}/items`, ({ request }) => {
        const inArchive = new URL(request.url).searchParams.get('status') === 'archived';

        return HttpResponse.json({
          items: inArchive === restored ? [] : [inArchive ? archived : back],
          nextCursor: null,
        });
      }),
    );
    renderApp('/wardrobe?status=archived');
    await person.click(await screen.findByRole('link', { name: 'Scarf' }));

    await person.click(await screen.findByRole('button', { name: uk.item.restore }));

    expect(restored).toBe(true);
    await expect.poll(() => screen.queryByRole('button', { name: uk.item.restore })).toBeNull();
    expect(screen.queryByText(archivedLine)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: uk.item.archive })).toBeInTheDocument();

    // Back to the archive it came from, which no longer holds it; the wardrobe does.
    await person.click(screen.getByRole('button', { name: uk.window.back }));
    expect(await screen.findByText(uk.wardrobe.archiveEmpty)).toBeInTheDocument();
    await person.selectOptions(screen.getByLabelText(uk.wardrobe.show), uk.wardrobe.inWardrobe);

    expect(await screen.findByText('Scarf')).toBeInTheDocument();
  });
});

describe('Requirement: Every tag can be filled in', () => {
  /** Opens the part of the form that holds everything but slot, type and name. */
  async function openTheTags(person: ReturnType<typeof userEvent.setup>) {
    await person.click(await screen.findByText(uk.tags.more));
  }

  it('Scenario: Only slot and type are required', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    renderApp('/wardrobe/new');

    await choosePhoto(person);
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(Object.keys(seen.created[0] ?? {}).sort()).toEqual([
      'photoCutoutKey',
      'photoOriginalKey',
      'slot',
      'type',
    ]);
  });

  it('Scenario: Filled tags are sent', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    renderApp('/wardrobe/new');
    await choosePhoto(person);
    await openTheTags(person);

    const seasons = screen.getByRole('group', { name: uk.tags.seasons });
    await person.click(within(seasons).getByRole('checkbox', { name: uk.seasons.spring }));
    await person.click(within(seasons).getByRole('checkbox', { name: uk.seasons.winter }));
    const formality = screen.getByRole('group', { name: uk.tags.formality });
    await person.click(within(formality).getByRole('radio', { name: '4' }));
    await person.click(screen.getByRole('button', { name: uk.tags.addMaterial }));
    await person.selectOptions(screen.getByLabelText(uk.tags.material), uk.materials.wool);
    await person.type(screen.getByLabelText(uk.tags.percent), '80');
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.created[0]).toMatchObject({
      seasons: ['spring', 'winter'],
      formality: 4,
      materials: [{ material: 'wool', percent: 80 }],
    });
  });

  it('Scenario: All seasons at once', async () => {
    const person = userEvent.setup();
    signedIn();
    renderApp('/wardrobe/new');
    await openTheTags(person);

    await person.click(screen.getByRole('button', { name: uk.tags.allSeasons }));

    const seasons = screen.getByRole('group', { name: uk.tags.seasons });
    for (const season of SEASONS) {
      expect(within(seasons).getByRole('checkbox', { name: uk.seasons[season] })).toBeChecked();
    }
  });

  it('Scenario: A suggestion fills the form', async () => {
    const person = userEvent.setup();

    /** The form as a screen holds it, starting from a suggestion. */
    function Suggested() {
      const [draft, setDraft] = useState(() =>
        withSuggestion(
          emptyDraft(),
          readSuggestion({ pattern: 'stripes', styles: ['classic', 'preppy'] }),
        ),
      );

      return <TagForm draft={draft} onChange={setDraft} />;
    }

    render(<Suggested />);

    const pattern = screen.getByLabelText(uk.tags.pattern);
    const styles = screen.getByRole('group', { name: uk.tags.styles });
    expect(pattern).toHaveValue('stripes');
    expect(within(styles).getByRole('checkbox', { name: uk.styles.classic })).toBeChecked();
    expect(within(styles).getByRole('checkbox', { name: uk.styles.preppy })).toBeChecked();

    await person.selectOptions(pattern, uk.patterns.solid);
    await person.click(within(styles).getByRole('checkbox', { name: uk.styles.classic }));

    expect(pattern).toHaveValue('solid');
    expect(within(styles).getByRole('checkbox', { name: uk.styles.classic })).not.toBeChecked();
  });
});

describe("Requirement: An item's card says what it is (its tags)", () => {
  it('Scenario: The card shows the tags it has', async () => {
    signedIn();
    server.use(
      http.get(`${API}/items/tagged`, () =>
        HttpResponse.json({
          ...anItem({ id: 'tagged', name: 'Tagged' }),
          seasons: ['spring', 'autumn'],
          pattern: 'stripes',
          colors: [{ family: 'red', hex: '#c81e23', share: 1 }],
        }),
      ),
    );

    renderApp('/wardrobe/tagged');

    const details = await screen.findByRole('definition', { name: uk.tags.seasons });
    expect(details).toHaveTextContent(`${uk.seasons.spring}, ${uk.seasons.autumn}`);
    expect(screen.getByRole('definition', { name: uk.tags.pattern })).toHaveTextContent(
      uk.patterns.stripes,
    );
    expect(screen.getByRole('definition', { name: uk.tags.colors })).toHaveTextContent(
      uk.colors.red,
    );
    expect(screen.queryByText(uk.tags.fabricType)).not.toBeInTheDocument();
    expect(screen.queryByText(uk.tags.materials)).not.toBeInTheDocument();
  });
});

describe('Requirement: Every code a person reads has a label', () => {
  it('Scenario: No code is without a label', () => {
    const labels = [
      ...SLOTS.map((code) => uk.slots[code]),
      ...ITEM_TYPES.map((code) => uk.types[code]),
      ...PATTERNS.map((code) => uk.patterns[code]),
      ...FABRIC_TYPES.map((code) => uk.fabricTypes[code]),
      ...MATERIALS.map((code) => uk.materials[code]),
      ...FITS.map((code) => uk.fits[code]),
      ...LENGTHS.map((code) => uk.lengths[code]),
      ...RISES.map((code) => uk.rises[code]),
      ...SEASONS.map((code) => uk.seasons[code]),
      ...STYLES.map((code) => uk.styles[code]),
      ...OCCASIONS.map((code) => uk.occasions[code]),
      ...COLOR_FAMILIES.map((code) => uk.colors[code]),
      ...VISIBILITIES.map((code) => uk.visibility[code]),
      ...ARCHIVE_REASONS.map((code) => uk.archiveReasons[code]),
    ];

    for (const label of labels) {
      expect(label).toMatch(/\p{Script=Cyrillic}/u);
    }
  });
});
