import { setAccessToken } from '../../shared/api/token-store';
import { publicRequest, request } from '../../shared/api/client';
import type { IssuedAccessToken } from '../../shared/api/api.interfaces';
import type { Account, Credentials, Registration } from './session.interfaces';

export function currentAccount(): Promise<Account> {
  return request<Account>('/auth/me');
}

export async function signIn(credentials: Credentials): Promise<void> {
  const { accessToken } = await publicRequest<IssuedAccessToken>('/auth/sign-in', {
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
