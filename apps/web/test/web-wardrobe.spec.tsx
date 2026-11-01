import { ARCHIVE_REASONS, ITEM_TYPES, SLOTS, TYPES_BY_SLOT, VISIBILITIES } from '@closet/core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { uk } from '../src/i18n/uk';
import { anItem, signedIn } from './api-fixtures';
import { renderApp } from './render-app';
import { API, server } from './server';

const wardrobe = () => screen.findByRole('region', { name: uk.wardrobe.title });

/** A wardrobe of one page: whatever is passed, whatever is asked. */
function theWardrobeHolds(...items: object[]) {
  server.use(http.get(`${API}/items`, () => HttpResponse.json({ items, nextCursor: null })));
}

/** Answers by slot, the way the API narrows a list. */
function theApiFiltersBySlot(...items: Array<{ slot: string }>) {
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
  const UPLOAD = 'https://storage.test/upload';
  const KEY = 'items/owner/photo.png';
  const photo = new File(['bytes of a photograph'], 'blazer.png', { type: 'image/png' });

  /** Records what reaches the API and storage, and answers as both would. */
  function apiAndStorageWork() {
    const seen: {
      uploads: Array<{ contentType: string | null; authorization: string | null; size: number }>;
      created: object[];
    } = { uploads: [], created: [] };

    signedIn();
    server.use(
      http.post(`${API}/items/upload-url`, () => HttpResponse.json({ key: KEY, url: UPLOAD })),
      http.put(UPLOAD, async ({ request }) => {
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

  it('Scenario: An item is added with its photograph', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    renderApp('/wardrobe/new');

    await person.selectOptions(await screen.findByLabelText(uk.newItem.slot), uk.slots.shoes);
    await person.selectOptions(screen.getByLabelText(uk.newItem.type), uk.types.loafers);
    await person.type(screen.getByLabelText(uk.newItem.name), 'Added');
    await person.upload(screen.getByLabelText(uk.newItem.photo), photo);
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('region', { name: 'Added' })).toBeInTheDocument();
    expect(seen.uploads).toEqual([
      { contentType: 'image/png', authorization: null, size: photo.size },
    ]);
    expect(seen.created).toEqual([
      { slot: 'shoes', type: 'loafers', name: 'Added', photoOriginalKey: KEY },
    ]);
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

  it('Scenario: A failed upload creates nothing', async () => {
    const person = userEvent.setup();
    const seen = apiAndStorageWork();
    server.use(http.put(UPLOAD, () => new HttpResponse(null, { status: 403 })));
    renderApp('/wardrobe/new');

    await person.upload(await screen.findByLabelText(uk.newItem.photo), photo);
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.newItem.failed);
    expect(seen.created).toEqual([]);
  });
});

describe("Requirement: An item's card says what it is", () => {
  const skirt = anItem({ id: 'skirt', slot: 'bottom', type: 'skirt', name: 'Skirt' });

  function theApiHoldsTheSkirt() {
    signedIn();
    theApiFiltersBySlot(skirt);
    server.use(http.get(`${API}/items/skirt`, () => HttpResponse.json(skirt)));
  }

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

describe('Requirement: Every code a person reads has a label', () => {
  it('Scenario: No code is without a label', () => {
    const labels = [
      ...SLOTS.map((code) => uk.slots[code]),
      ...ITEM_TYPES.map((code) => uk.types[code]),
      ...VISIBILITIES.map((code) => uk.visibility[code]),
      ...ARCHIVE_REASONS.map((code) => uk.archiveReasons[code]),
    ];

    for (const label of labels) {
      expect(label).toMatch(/\p{Script=Cyrillic}/u);
    }
  });
});
