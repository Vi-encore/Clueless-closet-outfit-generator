import { setAccessToken } from '../platform/token-store';
import { publicRequest, request } from './client';
import type { Account, Credentials, Registration } from './api.interfaces';

export function currentAccount(): Promise<Account> {
  return request<Account>('/auth/me');
}

export async function signIn(credentials: Credentials): Promise<void> {
  const { accessToken } = await publicRequest<{ accessToken: string }>('/auth/sign-in', {
    method: 'POST',
    body: credentials,
  });

  setAccessToken(accessToken);
}

export async function signUp(registration: Registration): Promise<void> {
  await publicRequest<Account>('/auth/sign-up', { method: 'POST', body: registration });
}

export async function signOut(): Promise<void> {
  await publicRequest<void>('/auth/sign-out', { method: 'POST' });
}
