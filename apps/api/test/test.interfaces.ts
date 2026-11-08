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

/** A date column read back as Postgres prints it. */
export interface DateRow {
  date: string;
}

/** An outfit as the API answers with it, as far as a test reads it. */
export interface OutfitBody {
  id: string;
  occasion: string;
  score: { total: number; breakdown: Record<string, number> } | null;
  reaction: string | null;
  savedAt: string | null;
  items: OutfitItemBody[];
}

export interface OutfitItemBody {
  id: string;
  slot: string;
  photoUrl: string | null;
}

export interface OutfitPage {
  items: OutfitBody[];
  nextCursor: string | null;
}

export interface GenerateBody {
  outfit: OutfitBody | null;
}

export interface WearLogBody {
  id: string;
  outfitId: string;
  date: string;
}

/** What a test needs to create an item straight in the database. */
export interface ItemSeed {
  slot: string;
  type: string;
  status?: string;
}
