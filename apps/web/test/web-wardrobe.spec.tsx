import { ARCHIVE_REASONS, ITEM_TYPES, SLOTS, VISIBILITIES } from '@closet/core';
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
