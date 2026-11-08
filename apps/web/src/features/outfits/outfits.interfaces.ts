import type { OccasionCode, OutfitScore } from '@closet/core';
import type { InfiniteData } from '@tanstack/react-query';
import type { Page } from '../../shared/api/api.interfaces';
import type { Item } from '../wardrobe';

export type Reaction = 'like' | 'dislike';

/** An outfit as the API answers with one. */
export interface Outfit {
  id: string;
  occasion: OccasionCode;
  /** Null for a combination that was not generated. */
  score: OutfitScore | null;
  reaction: Reaction | null;
  /** When it was saved, as the API writes a moment; null when it is not. */
  savedAt: string | null;
  createdAt: string;
  /** In slot order: outerwear, top or one-piece, bottom, shoes. */
  items: Item[];
}

export interface GenerateRequest {
  occasion: OccasionCode;
  mustInclude?: string[];
  seen?: string[];
}

/** `outfit` is null when nothing can be made from what the person has. */
export interface GenerateAnswer {
  outfit: Outfit | null;
}

/** That an outfit was worn, on a calendar date `YYYY-MM-DD` in the person's time zone. */
export interface WearRecord {
  id: string;
  outfitId: string;
  date: string;
}

export type OutfitPages = InfiniteData<Page<Outfit>, string | undefined>;

export interface OutfitPanelProps {
  outfit: Outfit;
}

export interface ReasonProps {
  outfit: Outfit;
}

export interface ShownOutfitProps {
  id: string;
}
