import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { Public } from '../auth/public.decorator.js';
import { OutfitsService } from './outfits.service.js';
import { scoreOutfitRequestSchema, type ScoreOutfitRequest } from './score-outfit.request.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AccountView } from '../auth/auth.interfaces.js';
import {
  generateOutfitRequestSchema,
  type GenerateOutfitRequest,
} from './requests/generate-outfit.request.js';
import { reactionRequestSchema, type ReactionRequest } from './requests/reaction.request.js';
import { pageQuerySchema, type PageQuery } from '../pagination.js';
import type { Page } from '../pagination.interfaces.js';
import type {
  GenerateResponse,
  OutfitView,
  ScoreOutfitResponse,
  WearLogView,
} from './outfits.interfaces.js';

/** Checked for shape before Prisma, which would fail on a non-uuid with a 500. */
const outfitIdSchema = z.uuid();

@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfits: OutfitsService) {}

  /**
   * Scoring stores nothing and creates nothing, so the answer is 200. Without `@HttpCode`
   * Nest would answer 201 Created, which a POST route gets by default.
   */
  // Scoring reads nothing and stores nothing, so it stays open. On the method rather
  // than the class: on the class it would open every route here.
  @Public()
  @Post('score')
  @HttpCode(HttpStatus.OK)
  score(@Body({ schema: scoreOutfitRequestSchema }) body: ScoreOutfitRequest): ScoreOutfitResponse {
    return this.outfits.score(body);
  }

  /**
   * 200 whether or not an outfit could be made: one action, one success code, and the body
   * says what happened. The outfit is stored, but that is bookkeeping for the routes that
   * like, save and wear it, not what the caller asked for.
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(
    @CurrentUser() user: AccountView,
    @Body({ schema: generateOutfitRequestSchema }) body: GenerateOutfitRequest,
  ): Promise<GenerateResponse> {
    return this.outfits.generate(user.id, body);
  }

  /** Declared before `:id`, so `saved` is never read as one. */
  @Get('saved')
  listSaved(
    @CurrentUser() user: AccountView,
    @Query({ schema: pageQuerySchema }) query: PageQuery,
  ): Promise<Page<OutfitView>> {
    return this.outfits.listSaved(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: outfitIdSchema }) id: string,
  ): Promise<OutfitView> {
    return this.outfits.findOne(user.id, id);
  }

  @Put(':id/reaction')
  react(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: outfitIdSchema }) id: string,
    @Body({ schema: reactionRequestSchema }) body: ReactionRequest,
  ): Promise<OutfitView> {
    return this.outfits.react(user.id, id, body.reaction);
  }

  @Put(':id/save')
  save(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: outfitIdSchema }) id: string,
  ): Promise<OutfitView> {
    return this.outfits.save(user.id, id);
  }

  @Delete(':id/save')
  unsave(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: outfitIdSchema }) id: string,
  ): Promise<OutfitView> {
    return this.outfits.unsave(user.id, id);
  }

  /**
   * 201 whether the record was written now or already was: a retry whose answer was lost is
   * not an error, the body is the same record, and the caller has nothing to do differently.
   */
  @Post(':id/wear')
  wear(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: outfitIdSchema }) id: string,
  ): Promise<WearLogView> {
    return this.outfits.wear(user.id, id);
  }
}
