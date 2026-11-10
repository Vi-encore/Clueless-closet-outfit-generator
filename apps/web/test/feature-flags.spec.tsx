import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useFlag } from '../src/features/flags';
import { createQueryClient } from '../src/shared/api/query-client';
import type { WrapperProps } from './test.interfaces';
import { API, server } from './server';

/** The hook as a screen holds it: inside a cache, with nothing else around it. */
function flagAsAScreenSeesIt() {
  const client = createQueryClient();
  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return renderHook(() => useFlag('photoCutout'), { wrapper });
}

describe("Requirement: The client follows the deployment's flags", () => {
  it('Scenario: A flag switched off is followed', async () => {
    server.use(http.get(`${API}/flags`, () => HttpResponse.json({ photoCutout: false })));

    const { result } = flagAsAScreenSeesIt();

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('Scenario: No answer means the default', async () => {
    let asked = false;
    server.use(
      http.get(`${API}/flags`, () => {
        asked = true;

        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = flagAsAScreenSeesIt();

    expect(result.current).toBe(true);
    await waitFor(() => expect(asked).toBe(true));
    // Still the default once the failure has arrived, and not a flag switched off.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current).toBe(true);
  });
});
