import { COLOR_SWATCHES } from '@closet/core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { aStatsSummary, signedIn } from '../../../test/api-fixtures';
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
