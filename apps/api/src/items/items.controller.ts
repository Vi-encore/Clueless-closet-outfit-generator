import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ItemsService } from './items.service.js';
import { archiveItemQuerySchema, type ArchiveItemQuery } from './requests/archive-item.query.js';
import { createItemRequestSchema, type CreateItemRequest } from './requests/create-item.request.js';
import { listItemsQuerySchema, type ListItemsQuery } from './requests/list-items.query.js';
import { updateItemRequestSchema, type UpdateItemRequest } from './requests/update-item.request.js';
import { uploadUrlRequestSchema, type UploadUrlRequest } from './requests/upload-url.request.js';
import type { Page } from '../pagination.interfaces.js';
import type { AccountView } from '../auth/auth.interfaces.js';
import type { ItemView } from './items.interfaces.js';
import type { UploadTarget } from '../storage/storage.interfaces.js';

/**
 * Ids are checked for shape before they reach Prisma: the column is `uuid`, and a
 * query against it with something that is not one fails in the driver rather than
 * returning nothing, which would turn a mistyped URL into a 500.
 */
const itemIdSchema = z.uuid();

/**
 * No `@Public()` anywhere here, and that is the point: the global guard closes every
 * one of these routes, so the only thing left to get right is reading the owner from
 * the token rather than from the request.
 */
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  /** 201 is left as it is: this route creates something. */
  @Post()
  create(
    @CurrentUser() user: AccountView,
    @Body({ schema: createItemRequestSchema }) body: CreateItemRequest,
  ): Promise<ItemView> {
    return this.items.create(user.id, body);
  }

  /**
   * Declared before the routes that take an id, so `upload-url` can never be
   * read as one. 201, because a place to put a file is brought into being here.
   */
  @Post('upload-url')
  uploadUrl(
    @CurrentUser() user: AccountView,
    @Body({ schema: uploadUrlRequestSchema }) body: UploadUrlRequest,
  ): Promise<UploadTarget> {
    return this.items.uploadUrl(user.id, body.contentType);
  }

  @Get()
  list(
    @CurrentUser() user: AccountView,
    @Query({ schema: listItemsQuerySchema }) query: ListItemsQuery,
  ): Promise<Page<ItemView>> {
    return this.items.list(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: itemIdSchema }) id: string,
  ): Promise<ItemView> {
    return this.items.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: itemIdSchema }) id: string,
    @Body({ schema: updateItemRequestSchema }) body: UpdateItemRequest,
  ): Promise<ItemView> {
    return this.items.update(user.id, id, body);
  }

  /**
   * `DELETE` is what a client means, archiving is what happens. 200 rather than 204:
   * the archived item is the useful answer, since it carries the moment it was
   * archived - which a retry needs in order to see that nothing moved.
   */
  @Delete(':id')
  archive(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: itemIdSchema }) id: string,
    @Query({ schema: archiveItemQuerySchema }) query: ArchiveItemQuery,
  ): Promise<ItemView> {
    return this.items.archive(user.id, id, query.reason);
  }

  /**
   * The way back from `DELETE`. A route of its own rather than `status` in `PATCH`:
   * putting an item back also clears when and why it left, which a client should not
   * have to know. 200, since nothing is created.
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(
    @CurrentUser() user: AccountView,
    @Param('id', { schema: itemIdSchema }) id: string,
  ): Promise<ItemView> {
    return this.items.restore(user.id, id);
  }
}
