import type { Flags } from '@closet/core';
import { request } from '../../shared/api/client';

export function listFlags(): Promise<Flags> {
  return request<Flags>('/flags');
}
