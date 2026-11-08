import type { App } from 'supertest/types.js';
import type { INestApplication } from '@nestjs/common';

/** Somebody signed up for a test, and the token that speaks for them. */
export interface Account {
  id: string;
  token: string;
}

export interface Registered {
  id: string;
  accessToken: string;
}

/** Enough of a supertest response to read its cookies. */
export interface WithHeaders {
  headers: Record<string, unknown>;
}

/** One entry of a 400's `errors`, as far as a test reads it. */
export interface FieldError {
  path: string;
}

export interface ErrorBody {
  errors?: FieldError[];
}

export interface ReceivedMessage {
  id: string;
  body: string;
}

export interface WithUsername {
  user: { username: string };
}

export interface WithId {
  id: string;
}

export interface WithType {
  type: string;
}

export interface WithPhotoUrl {
  photoUrl: string | null;
}

export interface UserIdentity {
  email: string;
  username: string;
}

export interface CountRow {
  count: bigint;
}

export interface AnswerRow {
  answer: number;
}

export interface ColumnRow {
  data_type: string;
}

/** An application listening on a real port, and which one. */
export interface SocketApp {
  app: INestApplication<App>;
  port: number;
}
