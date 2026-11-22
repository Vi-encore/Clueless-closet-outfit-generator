import { COLOR_SWATCHES } from '@closet/core';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { aStatsSummary, anItem, signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import { uk } from '../../shared/i18n/uk';
import type { StatsSummary } from './stats.interfaces';
import type { UnwornAnswer, UnwornAsk } from '../../../test/test.interfaces';

/** Answers the statistics with `summary`, and the unworn list with nothing. */
function theStatsAre(summary: StatsSummary) {
  signedIn();
  server.use(
    http.get(`${API}/stats`, () => HttpResponse.json(summary)),
    http.get(`${API}/stats/unworn`, () => HttpResponse.json({ items: [], nextCursor: null })),
  );
}

const statsScreen = () => screen.findByRole('region', { name: uk.stats.title });

/** The legend of a chart, line by line, as a person reads it. */
async function legendOf(chart: string) {
  const figure = await screen.findByRole('figure', { name: chart });
  return within(figure)
    .getAllByRole('listitem')
    .map((line) => line.textContent ?? '');
}

describe('Requirement: Statistics are reached from the desktop', () => {
  it('Scenario: The shortcut', async () => {
    const person = userEvent.setup();
    theStatsAre(aStatsSummary());
    renderApp('/');

    await person.click(await screen.findByRole('link', { name: uk.stats.title }));

    expect(await statsScreen()).toBeInTheDocument();
  });

  it('Scenario: Back to the desktop', async () => {
    const person = userEvent.setup();
    theStatsAre(aStatsSummary());
    renderApp('/stats');

    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    expect(await screen.findByRole('region', { name: uk.desktop.title })).toBeInTheDocument();
  });
});

describe('Requirement: The wardrobe is shown in numbers', () => {
  it('Scenario: The share worn', async () => {
    theStatsAre(aStatsSummary({ items: 40, worn: 12 }));
    renderApp('/stats');

    expect(await screen.findByText(uk.stats.worn(12, 40, 30))).toBeInTheDocument();
  });

  it('Scenario: An empty wardrobe', async () => {
    theStatsAre(aStatsSummary());
    renderApp('/stats');

    expect(await screen.findByText(uk.stats.empty)).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });
});

describe('Requirement: Category and colour are pie charts', () => {
  it('Scenario: By category', async () => {
    theStatsAre(
      aStatsSummary({
        items: 4,
        bySlot: [
          { slot: 'top', count: 3 },
          { slot: 'bottom', count: 1 },
        ],
      }),
    );
    renderApp('/stats');

    expect(await legendOf(uk.stats.bySlot)).toEqual([`${uk.slots.top}3`, `${uk.slots.bottom}1`]);
  });

  it('Scenario: By colour', async () => {
    theStatsAre(
      aStatsSummary({
        items: 3,
        byColor: [
          { family: 'white', count: 2 },
          { family: null, count: 1 },
        ],
      }),
    );
    renderApp('/stats');

    expect(await legendOf(uk.stats.byColor)).toEqual([
      `${uk.colors.white}2`,
      `${uk.stats.noColors}1`,
    ]);
    const figure = screen.getByRole('figure', { name: uk.stats.byColor });
    const white = within(figure).getAllByRole('listitem')[0];
    expect(white?.querySelector('.swatch')).toHaveStyle({ backgroundColor: COLOR_SWATCHES.white });
  });
});

describe('Requirement: The most worn and the cost per wear are listed', () => {
  const sheet = (title: string) => screen.findByRole('region', { name: title });

  it('Scenario: The most worn', async () => {
    theStatsAre(
      aStatsSummary({
        items: 2,
        worn: 2,
        mostWorn: [
          anItem({ id: 'six', name: 'Six', wearCount: 6 }),
          anItem({ id: 'three', name: 'Three', wearCount: 3 }),
        ],
      }),
    );
    renderApp('/stats');

    const rows = within(await sheet(uk.stats.mostWorn)).getAllByRole('listitem');

    expect(rows.map((row) => row.textContent)).toEqual([
      `Six${uk.stats.times(6)}`,
      `Three${uk.stats.times(3)}`,
    ]);
    const bars = rows.map((row) => row.querySelector<HTMLElement>('.segmented-bar > span'));
    expect(bars.map((bar) => bar?.style.width)).toEqual(['100%', '50%']);
  });

  it('stands the pixel shirt in for a picture that is missing or does not load', async () => {
    theStatsAre(
      aStatsSummary({
        items: 2,
        worn: 2,
        mostWorn: [
          anItem({ id: 'gone', name: 'Gone', wearCount: 2, cutoutUrl: 'https://s.test/gone.webp' }),
          anItem({ id: 'none', name: 'None', wearCount: 1 }),
        ],
      }),
    );
    renderApp('/stats');

    const rows = within(await sheet(uk.stats.mostWorn)).getAllByRole('listitem');
    const pictures = rows.map((row) => row.querySelector('img'));
    expect(pictures[1]).toHaveClass('worn-placeholder');
    expect(pictures[0]).not.toHaveClass('worn-placeholder');

    fireEvent.error(pictures[0] as HTMLImageElement);

    expect(rows[0]?.querySelector('img')).toHaveClass('worn-placeholder');
  });

  it('Scenario: Cost per wear', async () => {
    theStatsAre(
      aStatsSummary({
        items: 2,
        worn: 1,
        costPerWear: [
          { item: anItem({ id: 'dress', name: 'Dress' }), perWear: '200.00', currency: 'UAH' },
        ],
        unwornWithPrice: [
          { item: anItem({ id: 'shoes', name: 'Shoes' }), price: '2500.00', currency: 'UAH' },
        ],
      }),
    );
    renderApp('/stats');

    expect(within(await sheet(uk.stats.costPerWear)).getByRole('listitem')).toHaveTextContent(
      `Dress${uk.stats.money('200.00', 'UAH')}`,
    );
    expect(within(await sheet(uk.stats.notYetWorn)).getByRole('listitem')).toHaveTextContent(
      `Shoes${uk.stats.money('2500.00', 'UAH')}`,
    );
  });

  it('shows neither list for a wardrobe with nothing worn and no prices', async () => {
    theStatsAre(aStatsSummary({ items: 1 }));
    renderApp('/stats');

    await screen.findByRole('region', { name: uk.stats.bySlot });

    expect(screen.queryByRole('region', { name: uk.stats.mostWorn })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: uk.stats.costPerWear })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: uk.stats.notYetWorn })).not.toBeInTheDocument();
  });
});

/** A line of the unworn list as the API answers it. */
const unworn = (id: string, name: string, lastWornAt: string | null = null) => ({
  item: anItem({ id, name }),
  lastWornAt,
});

/**
 * The statistics of a wardrobe of one, and an unworn list answered by `pages` in turn,
 * recording the days and cursor each request asked for.
 */
function theUnwornAre(...pages: UnwornAnswer[]) {
  const asked: UnwornAsk[] = [];
  signedIn();
  server.use(
    http.get(`${API}/stats`, () => HttpResponse.json(aStatsSummary({ items: 1 }))),
    http.get(`${API}/stats/unworn`, ({ request }) => {
      const query = new URL(request.url).searchParams;
      asked.push({ days: query.get('days'), cursor: query.get('cursor') });
      return HttpResponse.json(pages[asked.length - 1] ?? { items: [], nextCursor: null });
    }),
  );
  return asked;
}

const unwornSheet = () => screen.findByRole('region', { name: uk.stats.unwornTitle });

describe('Requirement: Items not worn for a long time are listed', () => {
  it('Scenario: Choosing how long', async () => {
    const person = userEvent.setup();
    const asked = theUnwornAre(
      { items: [unworn('a', 'Old coat', '2026-07-01T12:00:00.000Z')], nextCursor: null },
      { items: [], nextCursor: null },
    );
    renderApp('/stats');

    const sheet = await unwornSheet();
    expect(await within(sheet).findByText('Old coat')).toBeInTheDocument();
    expect(within(sheet).getByText(uk.stats.lastWorn('01.07.2026'))).toBeInTheDocument();

    await person.selectOptions(within(sheet).getByLabelText(uk.stats.unwornDays), '180');

    await waitFor(() => expect(asked.at(-1)?.days).toBe('180'));
    expect(asked[0]?.days).toBe('90');
  });

  it('keeps the choice in the address', async () => {
    const asked = theUnwornAre({ items: [], nextCursor: null });
    renderApp('/stats?days=30');

    const sheet = await unwornSheet();

    expect(within(sheet).getByLabelText(uk.stats.unwornDays)).toHaveValue('30');
    await waitFor(() => expect(asked[0]?.days).toBe('30'));
  });

  it('Scenario: More than one page', async () => {
    const person = userEvent.setup();
    const asked = theUnwornAre(
      { items: [unworn('a', 'First')], nextCursor: 'c1' },
      { items: [unworn('b', 'Second')], nextCursor: null },
    );
    renderApp('/stats');

    const sheet = await unwornSheet();
    await within(sheet).findByText('First');
    await person.click(within(sheet).getByRole('button', { name: uk.stats.more }));

    expect(await within(sheet).findByText('Second')).toBeInTheDocument();
    expect(within(sheet).getByText('First')).toBeInTheDocument();
    expect(asked[1]?.cursor).toBe('c1');
  });

  it('shows "never worn" for an item worn not once', async () => {
    theUnwornAre({ items: [unworn('a', 'Tags still on')], nextCursor: null });
    renderApp('/stats');

    const sheet = await unwornSheet();

    expect(await within(sheet).findByText(uk.stats.neverWorn)).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: /Tags still on/ })).toHaveAttribute(
      'href',
      '/wardrobe/a',
    );
  });

  it('Scenario: Nothing unworn', async () => {
    theUnwornAre({ items: [], nextCursor: null });
    renderApp('/stats');

    const sheet = await unwornSheet();

    expect(await within(sheet).findByText(uk.stats.allWorn(90))).toBeInTheDocument();
  });
});

describe('Requirement: An unworn item can be archived from the list', () => {
  function andArchiving() {
    const reasons: (string | null)[] = [];
    server.use(
      http.delete(`${API}/items/:id`, ({ request, params }) => {
        reasons.push(new URL(request.url).searchParams.get('reason'));
        return HttpResponse.json(anItem({ id: String(params.id), status: 'archived' }));
      }),
    );
    return reasons;
  }

  it('Scenario: Archived with a reason', async () => {
    const person = userEvent.setup();
    theUnwornAre(
      { items: [unworn('a', 'Old coat'), unworn('b', 'Old hat')], nextCursor: null },
      { items: [unworn('b', 'Old hat')], nextCursor: null },
    );
    const reasons = andArchiving();
    renderApp('/stats');

    const sheet = await unwornSheet();
    await within(sheet).findByText('Old coat');
    const row = within(sheet).getAllByRole('listitem')[0] as HTMLElement;

    await person.click(within(row).getByRole('button', { name: uk.stats.toArchive }));
    await person.selectOptions(within(row).getByLabelText(uk.item.reason), 'given_away');
    await person.click(within(row).getByRole('button', { name: uk.stats.archive }));

    await waitFor(() => expect(within(sheet).queryByText('Old coat')).not.toBeInTheDocument());
    expect(reasons).toEqual(['given_away']);
    expect(within(sheet).getByText('Old hat')).toBeInTheDocument();
  });

  it('Scenario: No reason, no archive', async () => {
    const person = userEvent.setup();
    theUnwornAre({ items: [unworn('a', 'Old coat')], nextCursor: null });
    const reasons = andArchiving();
    renderApp('/stats');

    const sheet = await unwornSheet();
    await within(sheet).findByText('Old coat');

    await person.click(within(sheet).getByRole('button', { name: uk.stats.toArchive }));
    await person.click(within(sheet).getByRole('button', { name: uk.stats.archive }));

    expect(await within(sheet).findByText(uk.item.noReason)).toBeInTheDocument();
    expect(reasons).toEqual([]);
    expect(within(sheet).getByText('Old coat')).toBeInTheDocument();
  });
});
