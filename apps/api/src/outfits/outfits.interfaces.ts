import type { FilterResult, OccasionCode, OutfitScore } from '@closet/core';
import type { Prisma } from '../generated/prisma/client.js';
import type { ItemView } from '../items/items.interfaces.js';
import type { Reaction } from './requests/reaction.request.js';

/** The filter verdict, plus a score only when the outfit got far enough to deserve one. */
export interface ScoreOutfitResponse {
  filters: FilterResult;
  score?: OutfitScore;
}

/** An outfit as the API answers with it: its items as the wardrobe answers them. */
export interface OutfitView {
  id: string;
  occasion: OccasionCode;
  /** Null for a combination that was not generated. */
  score: OutfitScore | null;
  reaction: Reaction | null;
  savedAt: Date | null;
  createdAt: Date;
  /** In slot order: outerwear, top or one-piece, bottom, shoes. */
  items: ItemView[];
}

/** `outfit` is null when no outfit can be made from what the person has. */
export interface GenerateResponse {
  outfit: OutfitView | null;
}

export interface WearLogView {
  id: string;
  outfitId: string;
  /** A calendar date, `YYYY-MM-DD`, in the person's time zone. */
  date: string;
}

/** An outfit row read together with its items' rows. */
export type StoredOutfit = Prisma.OutfitGetPayload<{
  include: { items: { include: { item: true } } };
}>;
