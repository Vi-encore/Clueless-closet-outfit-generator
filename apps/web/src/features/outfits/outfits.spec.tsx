import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { anItem, anOutfit, signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import { uk } from '../../shared/i18n/uk';
import type { GenerateRequest, Outfit } from './outfits.interfaces';

const outfitScreen = () => screen.findByRole('region', { name: uk.outfits.title });

/** Answers every generation with the next of `outfits`, and records what was asked. */
function theApiGenerates(...outfits: (Outfit | null)[]): GenerateRequest[] {
  const asked: GenerateRequest[] = [];
  signedIn();
  server.use(
    http.post(`${API}/outfits/generate`, async ({ request }) => {
      asked.push((await request.json()) as GenerateRequest);
      return HttpResponse.json({ outfit: outfits[asked.length - 1] ?? null });
    }),
  );
  return asked;
}

async function make(person: ReturnType<typeof userEvent.setup>) {
  await person.click(await screen.findByRole('button', { name: uk.outfits.make }));
}

describe('Requirement: The outfits are reached from the desktop', () => {
  it('Scenario: The shortcut', async () => {
    const person = userEvent.setup();
    signedIn();
    renderApp('/');

    await person.click(await screen.findByRole('link', { name: uk.outfits.title }));

    expect(await outfitScreen()).toBeInTheDocument();
  });

  it('Scenario: The outfit screen leads back to the desktop', async () => {
    const person = userEvent.setup();
    signedIn();
    renderApp('/outfits');

    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    expect(await screen.findByRole('region', { name: uk.desktop.title })).toBeInTheDocument();
  });
});

describe('Requirement: An outfit is made for a chosen occasion', () => {
  it('Scenario: An outfit for work', async () => {
    const person = userEvent.setup();
    const asked = theApiGenerates(anOutfit({ occasion: 'work' }));
    renderApp('/outfits');

    await person.selectOptions(await screen.findByLabelText(uk.outfits.occasion), 'work');
    await make(person);

    const doll = await screen.findByRole('figure', { name: uk.outfits.doll });
    expect(within(doll).getByRole('img', { name: 'White blouse' })).toBeInTheDocument();
    expect(within(doll).getByRole('img', { name: 'Plaid skirt' })).toBeInTheDocument();
    expect(asked).toEqual([{ occasion: 'work' }]);
  });

  it('keeps the occasion in the address', async () => {
    const person = userEvent.setup();
    const asked = theApiGenerates(anOutfit({ occasion: 'party' }));
    renderApp('/outfits?occasion=party');

    expect(await screen.findByLabelText(uk.outfits.occasion)).toHaveValue('party');
    await make(person);

    await screen.findByRole('figure', { name: uk.outfits.doll });
    expect(asked).toEqual([{ occasion: 'party' }]);
  });

  it('Scenario: Nothing to make an outfit from', async () => {
    const person = userEvent.setup();
    theApiGenerates(null);
    renderApp('/outfits');

    await make(person);

    expect(await screen.findByText(uk.outfits.nothing)).toBeInTheDocument();
  });

  it('Scenario: A failed request', async () => {
    const person = userEvent.setup();
    signedIn();
    server.use(http.post(`${API}/outfits/generate`, () => HttpResponse.error()));
    renderApp('/outfits');

    await make(person);

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.errors.unavailable);
  });
});

describe('Requirement: An outfit says why it was chosen', () => {
  it('Scenario: The reason', async () => {
    const person = userEvent.setup();
    theApiGenerates(anOutfit({ score: { total: 1.5, breakdown: { color: 0.5, formality: 1 } } }));
    renderApp('/outfits');

    await make(person);

    const reason = await screen.findByRole('list', { name: uk.outfits.why });
    expect(within(reason).getByText(uk.outfits.components.color).closest('li')).toHaveTextContent(
      '0,5',
    );
    expect(
      within(reason).getByText(uk.outfits.components.formality).closest('li'),
    ).toHaveTextContent('1,0');
    expect(screen.queryByText(uk.outfits.mismatch)).toBeNull();
  });

  it('Scenario: A mismatch', async () => {
    const person = userEvent.setup();
    theApiGenerates(anOutfit({ score: { total: -0.5, breakdown: { color: -1, formality: 0.5 } } }));
    renderApp('/outfits');

    await make(person);

    expect(await screen.findByText(uk.outfits.mismatch)).toBeInTheDocument();
  });
});

describe('Requirement: Another one is another outfit', () => {
  it('Scenario: Two in a row', async () => {
    const person = userEvent.setup();
    const asked = theApiGenerates(
      anOutfit({ id: 'first' }),
      anOutfit({ id: 'second' }),
      anOutfit({ id: 'third' }),
    );
    renderApp('/outfits');

    await make(person);
    await person.click(await screen.findByRole('button', { name: uk.outfits.another }));
    await expect.poll(() => asked.length).toBe(2);
    await person.click(await screen.findByRole('button', { name: uk.outfits.another }));
    await expect.poll(() => asked.length).toBe(3);

    expect(asked.map((request) => request.seen)).toEqual([
      undefined,
      ['first'],
      ['first', 'second'],
    ]);
  });
});

describe('Requirement: An outfit can be liked, saved and worn', () => {
  const OUTFIT = anOutfit();

  it('Scenario: Like, then take it back', async () => {
    const person = userEvent.setup();
    theApiGenerates(OUTFIT);
    const told: unknown[] = [];
    server.use(
      http.put(`${API}/outfits/${OUTFIT.id}/reaction`, async ({ request }) => {
        const body = (await request.json()) as Pick<Outfit, 'reaction'>;
        told.push(body.reaction);
        return HttpResponse.json({ ...OUTFIT, reaction: body.reaction });
      }),
    );
    renderApp('/outfits');
    await make(person);

    const like = await screen.findByRole('button', { name: uk.outfits.like });
    await person.click(like);
    await expect.poll(() => like.getAttribute('aria-pressed')).toBe('true');
    await person.click(like);
    await expect.poll(() => like.getAttribute('aria-pressed')).toBe('false');

    expect(told).toEqual(['like', null]);
  });

  it('Scenario: Save', async () => {
    const person = userEvent.setup();
    theApiGenerates(OUTFIT);
    let saved = 0;
    server.use(
      http.put(`${API}/outfits/${OUTFIT.id}/save`, () => {
        saved += 1;
        return HttpResponse.json({ ...OUTFIT, savedAt: '2026-11-08T10:05:00.000Z' });
      }),
    );
    renderApp('/outfits');
    await make(person);

    await person.click(await screen.findByRole('button', { name: uk.outfits.save }));

    expect(await screen.findByRole('button', { name: uk.outfits.unsave })).toBeInTheDocument();
    expect(saved).toBe(1);
  });

  it('Scenario: Wore it today', async () => {
    const person = userEvent.setup();
    theApiGenerates(OUTFIT);
    server.use(
      http.post(`${API}/outfits/${OUTFIT.id}/wear`, () =>
        HttpResponse.json({ id: 'log', outfitId: OUTFIT.id, date: '2026-03-02' }, { status: 201 }),
      ),
    );
    renderApp('/outfits');
    await make(person);

    await person.click(await screen.findByRole('button', { name: uk.outfits.wear }));

    expect(await screen.findByText(uk.outfits.wornOn('02.03.2026'))).toBeInTheDocument();
  });
});

describe('Requirement: An outfit can be made around an item', () => {
  const SKIRT = anItem({ id: 'skirt', name: 'Plaid skirt', slot: 'bottom', type: 'skirt' });

  it('Scenario: From the card', async () => {
    const person = userEvent.setup();
    const asked = theApiGenerates(anOutfit());
    server.use(http.get(`${API}/items/${SKIRT.id}`, () => HttpResponse.json(SKIRT)));
    renderApp(`/wardrobe/${SKIRT.id}`);

    await person.click(await screen.findByRole('link', { name: uk.item.makeOutfit }));

    expect(await outfitScreen()).toBeInTheDocument();
    await screen.findByRole('figure', { name: uk.outfits.doll });
    expect(asked).toEqual([{ occasion: 'casual', mustInclude: [SKIRT.id] }]);
  });

  it('Scenario: Not for an archived item', async () => {
    signedIn();
    const archived = {
      ...SKIRT,
      status: 'archived' as const,
      archivedAt: '2026-11-01T10:00:00.000Z',
    };
    server.use(http.get(`${API}/items/${SKIRT.id}`, () => HttpResponse.json(archived)));
    renderApp(`/wardrobe/${SKIRT.id}`);

    await screen.findByRole('button', { name: uk.item.restore });

    expect(screen.queryByRole('link', { name: uk.item.makeOutfit })).toBeNull();
  });

  it('says when nothing can be made around the item', async () => {
    theApiGenerates(null);
    renderApp(`/outfits?with=${SKIRT.id}`);

    expect(await screen.findByText(uk.outfits.nothingAround)).toBeInTheDocument();
  });
});

describe('Requirement: Saved outfits can be found again', () => {
  it('Scenario: The saved list', async () => {
    const person = userEvent.setup();
    const work = anOutfit({
      id: 'work-outfit',
      occasion: 'work',
      savedAt: '2026-11-07T10:00:00.000Z',
    });
    const party = anOutfit({
      id: 'party-outfit',
      occasion: 'party',
      savedAt: '2026-11-06T10:00:00.000Z',
    });
    signedIn();
    server.use(
      http.get(`${API}/outfits/saved`, () =>
        HttpResponse.json({ items: [work, party], nextCursor: null }),
      ),
      http.get(`${API}/outfits/${party.id}`, () => HttpResponse.json(party)),
    );
    renderApp('/outfits/saved');

    const list = await screen.findByRole('list', { name: uk.outfits.saved });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(2);
    await person.click(within(list).getByRole('link', { name: new RegExp(uk.occasions.party) }));

    expect(await screen.findByRole('figure', { name: uk.outfits.doll })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: uk.outfits.unsave })).toBeInTheDocument();
  });

  it('shows a line when nothing is saved', async () => {
    signedIn();
    server.use(
      http.get(`${API}/outfits/saved`, () => HttpResponse.json({ items: [], nextCursor: null })),
    );
    renderApp('/outfits/saved');

    expect(await screen.findByText(uk.outfits.savedEmpty)).toBeInTheDocument();
  });

  it("Scenario: Someone else's outfit", async () => {
    signedIn();
    server.use(
      http.get(`${API}/outfits/not-mine`, () =>
        HttpResponse.json({ message: 'No such outfit' }, { status: 404 }),
      ),
    );
    renderApp('/outfits/not-mine');

    expect(await screen.findByRole('region', { name: uk.notFound.title })).toBeInTheDocument();
  });
});
