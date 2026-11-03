import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '../src/app/app';

/** The whole application, opened at a path, the way a person arrives at one. */
export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
