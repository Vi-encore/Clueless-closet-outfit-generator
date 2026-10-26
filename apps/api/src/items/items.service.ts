import { itemTagsSchema, type ArchiveReason } from '@closet/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendsService } from '../friends/friends.service.js';
import type { Item } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { keyFor, ownerOf } from '../storage/keys.js';
import { StorageService, type UploadTarget } from '../storage/storage.service.js';
import { pageArgs, toPage, type Page, type PageQuery } from '../pagination.js';
import { UsersService } from '../users/users.service.js';
import { validationException } from '../validation/validation-exception.js';
import type { CreateItemRequest } from './requests/create-item.request.js';
import type { ListItemsQuery } from './requests/list-items.query.js';
import type { UpdateItemRequest } from './requests/update-item.request.js';

/**
 * An item as the API answers with it: the row, plus a link to its photograph.
 *
 * The link is short-lived and carries its own authorisation, which is what lets
 * a browser render `<img src>` with no token anywhere - and what makes it safe
 * to put in a list, since one that leaks stops working in minutes.
 */
export interface ItemView extends Item {
  photoUrl: string | null;
}

/**
 * The stored row reduced to the tags `itemTagsSchema` describes.
 *
 * Two translations happen here. The row carries columns the schema knows nothing
 * about, and it answers `null` where a tag was never filled in - while an optional
 * field accepts `undefined` and refuses `null`. Feeding the row in untouched would
 * fail on every tag the owner has not got round to yet.
 */
function tagsOf(item: Item): Record<string, unknown> {
  const tags: Record<string, unknown> = {};

  for (const key of Object.keys(itemTagsSchema.shape)) {
    const value = (item as unknown as Record<string, unknown>)[key];

    if (value !== null && value !== undefined) {
      tags[key] = value;
    }
  }

  return tags;
}

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
    private readonly storage: StorageService,
    private readonly users: UsersService,
  ) {}

  /**
   * Adds an item to one person's wardrobe.
   *
   * The owner is a parameter rather than a field of the request, and that is the whole
   * defence: zod strips keys it does not know, so an `ownerId` sent in the body is gone
   * before this method is reached, and this line is the only place the column is set.
   */
  async create(ownerId: string, input: CreateItemRequest): Promise<ItemView> {
    this.assertOwnKey(ownerId, input.photoOriginalKey);

    return this.withPhoto(await this.prisma.item.create({ data: { ...input, ownerId } }));
  }

  /**
   * Refuses a photo key that was issued to somebody else, or to nobody.
   *
   * The upload URL is handed out before the item exists, so the key leaves
   * through the client and comes back on this request, where it could be any
   * string at all. `ownerOf` answers null for anything that is not a key this
   * API ever made, which fails the comparison exactly as a stolen one does.
   */
  private assertOwnKey(ownerId: string, key: string | undefined): void {
    if (key !== undefined && ownerOf(key) !== ownerId) {
      throw new BadRequestException('That photo key was not issued to you');
    }
  }

  /** The row with a link to its photograph, or with null where there is none. */
  private async withPhoto(item: Item): Promise<ItemView> {
    return {
      ...item,
      photoUrl: item.photoOriginalKey ? await this.storage.viewUrl(item.photoOriginalKey) : null,
    };
  }

  private withPhotos(items: Item[]): Promise<ItemView[]> {
    return Promise.all(items.map((item) => this.withPhoto(item)));
  }

  /**
   * A page of rows, with a link on each.
   *
   * The page is cut first and signed afterwards, so the extra row `pageArgs`
   * asked for - the one that only answers "is there more" - is not signed and
   * thrown away.
   */
  private async pageWithPhotos(rows: Item[], limit: number): Promise<Page<ItemView>> {
    const page = toPage(rows, limit);

    return { ...page, items: await this.withPhotos(page.items) };
  }

  /**
   * Somewhere to put a photograph, before there is an item to attach it to.
   *
   * The key names the person asking, which is what stops one being useful to
   * anybody else when it comes back on the request that creates the item.
   */
  uploadUrl(ownerId: string, contentType: string): Promise<UploadTarget> {
    return this.storage.uploadUrl(keyFor(ownerId, contentType), contentType);
  }

  /** One person's wardrobe, narrowed by whatever they asked for, one page at a time. */
  async list(ownerId: string, query: ListItemsQuery): Promise<Page<ItemView>> {
    const rows = await this.prisma.item.findMany({
      where: {
        ownerId,
        slot: query.slot,
        status: query.status ?? { not: 'archived' },
      },
      ...pageArgs(query),
    });

    return this.pageWithPhotos(rows, query.limit);
  }

  /**
   * The part of somebody else's wardrobe they have opened to friends.
   *
   * Answers 404 rather than an empty list when the two are not friends. An empty
   * list would confirm that the person exists, which is exactly what somebody
   * working through names should not be able to learn by asking.
   *
   * Blocking needs no mention here: it asks whether the two are friends, and a
   * blocked pair is not.
   */
  async listVisibleTo(
    viewerId: string,
    username: string,
    query: PageQuery,
  ): Promise<Page<ItemView>> {
    const owner = await this.users.findByUsername(username);
    // Your own name works, so a client rendering "somebody's wardrobe" does not meet
    // a 404 on the one person it is certain about.
    const allowed = owner.id === viewerId || (await this.friends.areFriends(viewerId, owner.id));

    if (!allowed) {
      // Before any paging: a stranger must not be able to tell an empty page from
      // a refusal.
      throw new NotFoundException('No such person');
    }

    const rows = await this.prisma.item.findMany({
      where: { ownerId: owner.id, visibility: 'friends', status: { not: 'archived' } },
      ...pageArgs(query),
    });

    return this.pageWithPhotos(rows, query.limit);
  }

  /**
   * One item, if it is theirs.
   *
   * This is also the public face of the ownership check: a caller that holds an id
   * and a user - the chat gateway in step 6, forwarding an item into a conversation -
   * asks this and gets either the item or the same 404 everybody else gets.
   */
  async findOne(ownerId: string, id: string): Promise<ItemView> {
    return this.withPhoto(await this.ownedOrNotFound(ownerId, id));
  }

  /**
   * Corrects an item's tags.
   *
   * The pipe has already checked that each field is a legal value on its own; what it
   * could not check is the one rule that needs two fields at once. A patch may carry
   * `type` without `slot`, so the pair is judged here, against the item as it will be
   * rather than as the request describes it.
   */
  async update(ownerId: string, id: string, patch: UpdateItemRequest): Promise<ItemView> {
    const stored = await this.ownedOrNotFound(ownerId, id);

    this.assertOwnKey(ownerId, patch.photoOriginalKey);

    const merged = itemTagsSchema.safeParse({ ...tagsOf(stored), ...patch });

    if (!merged.success) {
      // Raised in the pipe's own shape. A client that meets two different formats for
      // the same kind of mistake has to learn both, and will get one of them wrong.
      throw validationException(merged.error.issues);
    }

    // `patch` holds only the keys that were sent, so everything else is left alone.
    const updated = await this.prisma.item.update({ where: { id }, data: patch });

    return this.withPhoto(updated);
  }

  /**
   * Takes an item out of the wardrobe without taking it out of the database.
   *
   * Outfit history and statistics keep pointing at items long after their owner has
   * stopped wearing them, so `DELETE` is a change of status rather than a row going
   * away. Real deletion is an explicit act that does not exist yet.
   */
  async archive(ownerId: string, id: string, reason?: ArchiveReason): Promise<ItemView> {
    const stored = await this.ownedOrNotFound(ownerId, id);

    if (stored.status === 'archived') {
      // Already where the request wanted it. Archiving states something about the
      // world rather than recording an event, so a client retrying a request whose
      // answer it never saw is right, not wrong - and the moment the item actually
      // left the wardrobe is the first one, which the history cares about.
      return this.withPhoto(stored);
    }

    const archived = await this.prisma.item.update({
      where: { id },
      data: { status: 'archived', archivedAt: new Date(), archivedReason: reason ?? null },
    });

    return this.withPhoto(archived);
  }

  /**
   * The single query that answers "does this exist" and "is it theirs" at once.
   *
   * Nothing here may fetch an item by id alone. Asking the two questions separately
   * is how an IDOR bug is born: the second one gets forgotten in one method, or
   * written slightly differently in the next.
   */
  private async ownedOrNotFound(ownerId: string, id: string): Promise<Item> {
    const item = await this.prisma.item.findFirst({ where: { id, ownerId } });

    if (!item) {
      // Not 403. That would confirm the id belongs to somebody, which is the one
      // thing worth withholding from whoever is working through guesses.
      throw new NotFoundException('No such item');
    }

    return item;
  }
}
