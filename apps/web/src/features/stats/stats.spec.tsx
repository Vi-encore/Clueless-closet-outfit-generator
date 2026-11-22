import { COLOR_SWATCHES } from '@closet/core';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { aStatsSummary, anItem, signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import { uk } from '../../shared/i18n/uk';
import type { StatsSummary } from './stats.interfaces';

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
