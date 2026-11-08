import { checkHardFilters, scoreOutfit } from '@closet/core';
import { Injectable } from '@nestjs/common';
import type { ScoreOutfitRequest } from './score-outfit.request.js';
import type { ScoreOutfitResponse } from './outfits.interfaces.js';

@Injectable()
export class OutfitsService {
  /**
   * Hard filters first: an outfit that breaks one is not scored at all, and the caller is
   * told why rather than handed a low number it would have to interpret.
   */
  score(request: ScoreOutfitRequest): ScoreOutfitResponse {
    const filters = checkHardFilters(request.items, request.occasion);

    if (!filters.ok) {
      return { filters };
    }

    return { filters, score: scoreOutfit(request.items, request.occasion) };
  }
}
