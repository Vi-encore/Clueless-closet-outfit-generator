import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import { OutfitsService, type ScoreOutfitResponse } from './outfits.service.js';
import { scoreOutfitRequestSchema, type ScoreOutfitRequest } from './score-outfit.request.js';

// Scoring reads nothing and stores nothing, so it stays open for now. When the
// generator starts working from a real wardrobe, this is the line to revisit.
@Public()
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfits: OutfitsService) {}

  /**
   * Scoring stores nothing and creates nothing, so the answer is 200. Without `@HttpCode`
   * Nest would answer 201 Created, which a POST route gets by default.
   */
  @Post('score')
  @HttpCode(HttpStatus.OK)
  score(@Body({ schema: scoreOutfitRequestSchema }) body: ScoreOutfitRequest): ScoreOutfitResponse {
    return this.outfits.score(body);
  }
}
