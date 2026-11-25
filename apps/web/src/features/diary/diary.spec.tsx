import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aDiaryEntry, anOutfit, signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import { uk } from '../../shared/i18n/uk';
import { readPhoto } from '../wardrobe';
import type { DiaryEntry } from './diary.interfaces';

// Reading a photograph needs a real browser's canvas; what the diary does with the result
// is what these tests are about.
vi.mock('../wardrobe', async (original) => ({
  ...(await original<typeof import('../wardrobe')>()),
  readPhoto: vi.fn(),
}));

const ME = new Blob(['me in the outfit'], { type: 'image/webp' });

beforeEach(() => {
  vi.mocked(readPhoto).mockResolvedValue({
    image: { close: () => {} } as ImageBitmap,
    original: ME,
  });
});

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

const UPLOAD = 'https://storage.test/upload';
const KEY = 'diary/owner/1.webp';

/** Records what reaches storage and the record, and answers as both would. */
function savingWorks(entry: DiaryEntry, answer: Partial<DiaryEntry>) {
  const seen = { uploads: [] as Blob[], patches: [] as unknown[] };
  theDiaryHas(entry);
  server.use(
    http.post(`${API}/diary/upload-url`, () => HttpResponse.json({ key: KEY, url: UPLOAD })),
    http.put(UPLOAD, async ({ request }) => {
      seen.uploads.push(await request.blob());
      return new HttpResponse(null, { status: 200 });
    }),
    http.patch(`${API}/diary/${entry.id}`, async ({ request }) => {
      seen.patches.push(await request.json());
      return HttpResponse.json({ ...entry, ...answer });
    }),
  );
  return seen;
}

const noteField = () => screen.findByLabelText(uk.diary.note);
const save = () => screen.findByRole('button', { name: uk.diary.save });

describe('Requirement: A day shows what was worn', () => {
  it('Scenario: A day with a record', async () => {
    theDiaryHas(aDiaryEntry({ note: 'First day at school' }));
    renderApp('/diary/2026-03-17');

    const doll = await screen.findByRole('figure', { name: uk.outfits.doll });
    expect(within(doll).getByRole('img', { name: 'White blouse' })).toBeInTheDocument();
    expect(await noteField()).toHaveValue('First day at school');
  });

  it('shows the photo of the day', async () => {
    theDiaryHas(aDiaryEntry({ photoUrl: 'https://s.test/me.webp' }));
    renderApp('/diary/2026-03-17');

    expect(await screen.findByRole('img', { name: uk.diary.photo })).toHaveAttribute(
      'src',
      'https://s.test/me.webp',
    );
  });

  it('Scenario: An empty day', async () => {
    theDiaryHas(aDiaryEntry());
    renderApp('/diary/2026-03-18');

    expect(await screen.findByText(uk.diary.nothing)).toBeInTheDocument();
  });

  it('leads back to its month', async () => {
    const person = userEvent.setup();
    theDiaryHas(aDiaryEntry());
    renderApp('/diary/2026-03-17');

    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    expect(await calendar()).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: uk.diary.next })).toHaveAttribute(
      'href',
      '/diary?month=2026-04',
    );
  });
});

describe('Requirement: A day takes a note and a photo', () => {
  it('Scenario: A note and a photo are saved', async () => {
    const person = userEvent.setup();
    const seen = savingWorks(aDiaryEntry(), {
      note: 'First day',
      photoUrl: 'https://s.test/diary/1.webp',
    });
    renderApp('/diary/2026-03-17');

    await person.type(await noteField(), 'First day');
    await person.upload(
      await screen.findByLabelText(uk.diary.choosePhoto),
      new File(['x'], 'me.jpg', { type: 'image/jpeg' }),
    );
    await screen.findByRole('img', { name: uk.diary.chosenPhoto });
    await person.click(await save());

    expect(await screen.findByRole('img', { name: uk.diary.photo })).toHaveAttribute(
      'src',
      'https://s.test/diary/1.webp',
    );
    expect(await noteField()).toHaveValue('First day');
    expect(seen.uploads).toHaveLength(1);
    expect(await seen.uploads[0]?.text()).toBe('me in the outfit');
    expect(seen.patches).toEqual([{ note: 'First day', photoKey: KEY }]);
  });

  it('leaves the photo alone when only the note changes', async () => {
    const person = userEvent.setup();
    const seen = savingWorks(aDiaryEntry({ photoUrl: 'https://s.test/me.webp' }), {
      note: 'Rain',
    });
    renderApp('/diary/2026-03-17');

    await person.type(await noteField(), 'Rain');
    await person.click(await save());

    await waitFor(() => expect(seen.patches).toEqual([{ note: 'Rain' }]));
    expect(seen.uploads).toEqual([]);
  });

  it('Scenario: The photo is taken away', async () => {
    const person = userEvent.setup();
    const seen = savingWorks(aDiaryEntry({ photoUrl: 'https://s.test/me.webp' }), {
      photoUrl: null,
    });
    renderApp('/diary/2026-03-17');

    await person.click(await screen.findByRole('button', { name: uk.diary.removePhoto }));
    await person.click(await save());

    await waitFor(() => expect(seen.patches).toEqual([{ note: null, photoKey: null }]));
    await waitFor(() =>
      expect(screen.queryByRole('img', { name: uk.diary.photo })).not.toBeInTheDocument(),
    );
  });

  it('Scenario: A note too long', async () => {
    const person = userEvent.setup();
    const seen = savingWorks(aDiaryEntry(), {});
    renderApp('/diary/2026-03-17');

    await person.click(await noteField());
    await person.paste('a'.repeat(2001));

    expect(await save()).toBeDisabled();
    await person.click(await save());
    expect(seen.patches).toEqual([]);
  });

  it('Scenario: A failed save', async () => {
    const person = userEvent.setup();
    theDiaryHas(aDiaryEntry());
    server.use(http.patch(`${API}/diary/:id`, () => new HttpResponse(null, { status: 400 })));
    renderApp('/diary/2026-03-17');

    await person.type(await noteField(), 'Rain');
    await person.click(await save());

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.diary.saveFailed);
  });
});

/** Answers the desktop's memories with `memories`, and counts the times it was asked. */
function theDesktopRemembers(...memories: { kind: 'year' | 'month'; entry: DiaryEntry }[]) {
  const asked = { times: 0 };
  signedIn();
  server.use(
    http.get(`${API}/diary/memories`, () => {
      asked.times += 1;
      return HttpResponse.json(memories);
    }),
  );
  return asked;
}

describe('Requirement: Memories are on the desktop', () => {
  it('Scenario: A year ago', async () => {
    theDesktopRemembers({
      kind: 'year',
      entry: aDiaryEntry({ date: '2025-11-22', photoUrl: 'https://s.test/me.webp' }),
    });
    renderApp('/');

    const memory = await screen.findByRole('link', { name: uk.diary.memory.year });
    expect(memory).toHaveAttribute('href', '/diary/2025-11-22');
    expect(within(memory).getByRole('img', { name: uk.diary.photo })).toHaveAttribute(
      'src',
      'https://s.test/me.webp',
    );
  });

  it('a month ago, with no photo, is the doll', async () => {
    theDesktopRemembers({ kind: 'month', entry: aDiaryEntry({ date: '2026-10-22' }) });
    renderApp('/');

    const memory = await screen.findByRole('link', { name: uk.diary.memory.month });
    expect(memory).toHaveAttribute('href', '/diary/2026-10-22');
    expect(within(memory).getByRole('figure', { name: uk.outfits.doll })).toBeInTheDocument();
  });

  it('Scenario: Nothing to remember', async () => {
    const asked = theDesktopRemembers();
    renderApp('/');

    await screen.findByRole('region', { name: uk.desktop.title });
    await waitFor(() => expect(asked.times).toBe(1));

    expect(screen.queryByRole('region', { name: uk.diary.memories })).not.toBeInTheDocument();
  });

  it('a failed request leaves the desktop as it is', async () => {
    signedIn();
    server.use(http.get(`${API}/diary/memories`, () => new HttpResponse(null, { status: 500 })));
    renderApp('/');

    expect(await screen.findByRole('link', { name: uk.diary.title })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
