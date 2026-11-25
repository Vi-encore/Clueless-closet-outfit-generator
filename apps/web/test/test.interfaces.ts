import type { UnwornLine } from '../src/features/stats/stats.interfaces';
import type { ReactNode } from 'react';
import type { Relation } from '../src/features/friends/friends.interfaces';
import type { Box, DrawingCanvas, Size } from '../src/features/wardrobe/photo/photo.interfaces';

/** A canvas for tests that remembers the size of everything drawn on it. */
export interface RecordingCanvas extends DrawingCanvas {
  drawnAt: Size[];
  /** The part of the source each drawing took. */
  drawnFrom: Box[];
}

export interface People {
  friends?: Relation[];
  waiting?: Relation[];
  sent?: Relation[];
  blocked?: Relation[];
}

export interface HasSlot {
  slot: string;
}

/** One upload, as storage received it. */
export interface SeenUpload {
  contentType: string | null;
  authorization: string | null;
  size: number;
}

/** What reached storage and the API while adding an item. */
export interface Seen {
  uploads: SeenUpload[];
  created: object[];
}

/** How the test gateway answers a message: what the client's `emitWithAck` receives. */
export type Ack = (answer: unknown) => void;

/** What the client sends with `message:send`, as far as the tests read it. */
export interface SentPayload {
  id: string;
  body: string;
}

/** A message the test gateway has not answered yet. */
export interface HeldMessage {
  payload: SentPayload;
  ack: Ack;
}

/** What a `renderHook` wrapper is given. */
export interface WrapperProps {
  children: ReactNode;
}

/** Browser features a test puts in place, or leaves out, for sharing a link. */
export interface DeviceFeatures {
  share?: unknown;
  clipboard?: unknown;
}

/** What one request of the unworn list asked for. */
export interface UnwornAsk {
  days: string | null;
  cursor: string | null;
}

/** One page of the unworn list, as a test has the API answer it. */
export interface UnwornAnswer {
  items: UnwornLine[];
  nextCursor: string | null;
}
