import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { AccountView } from '../auth/auth.interfaces.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UploadTarget } from '../storage/storage.interfaces.js';
import { diaryEntryIdSchema } from './diary.constants.js';
import type { DiaryEntry, Memory } from './diary.interfaces.js';
import { DiaryService } from './diary.service.js';
import { monthQuerySchema, type MonthQuery } from './requests/month.query.js';
import {
  updateEntryRequestSchema,
  type UpdateEntryRequest,
} from './requests/update-entry.request.js';
import {
  diaryUploadUrlRequestSchema,
  type DiaryUploadUrlRequest,
} from './requests/upload-url.request.js';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diary: DiaryService) {}

  @Get()
  month(
    @CurrentUser() user: AccountView,
    @Query({ schema: monthQuerySchema }) query: MonthQuery,
  ): Promise<DiaryEntry[]> {
    return this.diary.month(user.id, query.month);
  }

  @Get('memories')
  memories(@CurrentUser() user: AccountView): Promise<Memory[]> {
    return this.diary.memories(user.id);
  }

  /** 201, as for an item's photo: a place to put a file is brought into being here. */
  @Post('upload-url')
  uploadUrl(
    @CurrentUser() user: AccountView,
    @Body({ schema: diaryUploadUrlRequestSchema }) body: DiaryUploadUrlRequest,
  ): Promise<UploadTarget> {
    return this.diary.uploadUrl(user.id, body.contentType);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: diaryEntryIdSchema }) id: string,
    @Body({ schema: updateEntryRequestSchema }) body: UpdateEntryRequest,
  ): Promise<DiaryEntry> {
    return this.diary.update(user.id, id, body);
  }
}
