import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aDiaryEntry, anOutfit, signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import { uk } from '../../shared/i18n/uk';
import type { DiaryEntry } from './diary.interfaces';

/**
 * Answers every month with `entries` of that month, and records which months were asked.
 * Only `Date` is faked by the tests that set a day, so the waits keep their real timers.
 */
function theDiaryHas(...entries: DiaryEntry[]): string[] {
  const asked: string[] = [];
  signedIn();
  server.use(
    http.get(`${API}/diary`, ({ request }) => {
      const month = new URL(request.url).searchParams.get('month') ?? '';
      asked.push(month);
      return HttpResponse.json(entries.filter(({ date }) => date.startsWith(`${month}-`)));
    }),
  );
  return asked;
}

function today(date: Date) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(date);
}

afterEach(() => {
  vi.useRealTimers();
});

const diaryScreen = () => screen.findByRole('region', { name: uk.diary.title });
const dayLink = (date: string, count = 1) =>
  screen.findByRole('link', { name: uk.diary.dayLink(date, count) });

/**
 * The calendar once its month has arrived. The grid is drawn at once and filled when the
 * answer comes; a test that ended before that would leave its request to land in the next.
 */
async function calendar() {
  const table = await screen.findByRole('table', { name: uk.diary.calendar });
  await waitFor(() => expect(table).not.toHaveAttribute('aria-busy', 'true'));
  return table;
}

describe('Requirement: The diary is reached from the desktop', () => {
  it('Scenario: The shortcut', async () => {
    today(new Date(2026, 10, 22, 12));
    const person = userEvent.setup();
    const asked = theDiaryHas();
    renderApp('/');

    await person.click(await screen.findByRole('link', { name: uk.diary.title }));

    expect(await diaryScreen()).toBeInTheDocument();
    await calendar();
    expect(asked).toEqual(['2026-11']);
  });

  it('Scenario: The diary leads back to the desktop', async () => {
    const person = userEvent.setup();
    theDiaryHas();
    renderApp('/diary?month=2026-03');
    await calendar();

    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    expect(await screen.findByRole('region', { name: uk.desktop.title })).toBeInTheDocument();
  });
});

describe('Requirement: A month is a calendar of what was worn', () => {
  it('Scenario: Days with and without a photo', async () => {
    theDiaryHas(
      aDiaryEntry({ id: 'd3', date: '2026-03-03', photoUrl: 'https://s.test/me.webp' }),
      aDiaryEntry({ id: 'd17', date: '2026-03-17' }),
    );
    renderApp('/diary?month=2026-03');

    const third = await dayLink('2026-03-03');
    expect(within(third).getByRole('img', { name: uk.diary.photo })).toHaveAttribute(
      'src',
      'https://s.test/me.webp',
    );
    expect(third).toHaveAttribute('href', '/diary/2026-03-03');

    const seventeenth = await dayLink('2026-03-17');
    const doll = within(seventeenth).getByRole('figure', { name: uk.outfits.doll });
    expect(within(doll).getByRole('img', { name: 'White blouse' })).toBeInTheDocument();
    expect(seventeenth).toHaveAttribute('href', '/diary/2026-03-17');
  });

  it('Scenario: Weeks start on Monday', async () => {
    theDiaryHas();
    renderApp('/diary?month=2026-03');

    const [header, firstWeek] = within(await calendar()).getAllByRole('row');
    const weekdays = within(header!).getAllByRole('columnheader');
    const days = within(firstWeek!).getAllByRole('cell', { hidden: true });

    expect(weekdays[0]).toHaveAccessibleName(uk.diary.weekdays[0]);
    expect(days[6]).toHaveTextContent('1');
    expect(days.slice(0, 6).every((cell) => cell.textContent === '')).toBe(true);
  });

  it('Scenario: Two outfits on one day', async () => {
    theDiaryHas(
      aDiaryEntry({ id: 'a', date: '2026-03-05' }),
      aDiaryEntry({ id: 'b', date: '2026-03-05', outfit: anOutfit({ id: 'another' }) }),
    );
    renderApp('/diary?month=2026-03');

    expect(await dayLink('2026-03-05', 2)).toHaveTextContent('2');
  });

  it('Scenario: Photos wait to be seen', async () => {
    theDiaryHas(aDiaryEntry({ date: '2026-03-03', photoUrl: 'https://s.test/me.webp' }));
    renderApp('/diary?month=2026-03');

    const third = await dayLink('2026-03-03');

    expect(within(third).getByRole('img', { name: uk.diary.photo })).toHaveAttribute(
      'loading',
      'lazy',
    );
  });

  it('marks today', async () => {
    today(new Date(2026, 2, 17, 12));
    theDiaryHas();
    renderApp('/diary');

    const marked = (await calendar()).querySelector('[aria-current="date"]');

    expect(marked).toHaveTextContent('17');
  });
});

describe('Requirement: Months are turned', () => {
  it('Scenario: The next month', async () => {
    const person = userEvent.setup();
    const asked = theDiaryHas();
    renderApp('/diary?month=2026-03');

    const next = await screen.findByRole('link', { name: uk.diary.next });
    expect(next).toHaveAttribute('href', '/diary?month=2026-04');
    await person.click(next);
    await calendar();

    expect(await screen.findByRole('link', { name: uk.diary.next })).toHaveAttribute(
      'href',
      '/diary?month=2026-05',
    );
    expect(asked).toEqual(['2026-03', '2026-04']);
  });

  it('the previous month crosses the year', async () => {
    theDiaryHas();
    renderApp('/diary?month=2026-01');
    await calendar();

    expect(await screen.findByRole('link', { name: uk.diary.previous })).toHaveAttribute(
      'href',
      '/diary?month=2025-12',
    );
  });

  it('Scenario: A month that cannot be read', async () => {
    today(new Date(2026, 10, 22, 12));
    const asked = theDiaryHas();
    renderApp('/diary?month=March');

    await calendar();

    expect(asked).toEqual(['2026-11']);
  });
});
