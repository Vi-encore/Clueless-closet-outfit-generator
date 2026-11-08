import type {
  ArchiveReason,
  FabricType,
  Fit,
  ItemColor,
  ItemMaterial,
  ItemStatus,
  ItemTags,
  ItemType,
  Length,
  Material,
  OccasionCode,
  Pattern,
  Rise,
  Season,
  Slot,
  Style,
  Visibility,
} from '@closet/core';
import type { InfiniteData } from '@tanstack/react-query';
import type { Page } from '../../shared/api/api.interfaces';

/** The part of an item the screens read. The API answers with every column. */
export interface Item {
  id: string;
  name: string | null;
  slot: Slot;
  type: ItemType;
  visibility: Visibility;
  status: ItemStatus;
  /** When it left the wardrobe, as the API writes a moment. Null unless archived. */
  archivedAt: string | null;
  archivedReason: ArchiveReason | null;
  /** Short-lived, and carries its own authorisation. Null when there is no photo. */
  photoUrl: string | null;
  /** The same for the item cut out of its background. Null where it was not. */
  cutoutUrl: string | null;
  colors: ItemColor[] | null;
  pattern: Pattern | null;
  fabricType: FabricType | null;
  materials: ItemMaterial[] | null;
  fit: Fit | null;
  length: Length | null;
  rise: Rise | null;
  seasons: Season[];
  warmth: number | null;
  formality: number | null;
  styles: Style[];
  occasions: OccasionCode[];
  avoidOccasions: OccasionCode[];
  brand: string | null;
  size: string | null;
  /** A decimal, which JSON carries as a string so that no cent is lost on the way. */
  price: string | null;
  currency: string;
  notes: string | null;
}

/** One line of a composition as the form holds it, before it is a number. */
export interface MaterialRow {
  /** Only for React's `key`: two rows can name the same material while being edited. */
  id: number;
  material: Material | '';
  percent: string;
}

/**
 * Every tag but slot, type and name, as the form holds them: an empty string or an empty
 * list for "not said", so that every control is controlled from the start.
 */
export interface TagDraft {
  colors: ItemColor[];
  pattern: Pattern | '';
  fabricType: FabricType | '';
  fit: Fit | '';
  length: Length | '';
  rise: Rise | '';
  seasons: Season[];
  styles: Style[];
  occasions: OccasionCode[];
  avoidOccasions: OccasionCode[];
  warmth: number | null;
  formality: number | null;
  materials: MaterialRow[];
  brand: string;
  size: string;
  price: string;
  notes: string;
}

/** The tags that were filled in, as `POST /items` takes them. Nothing else is sent. */
export type FilledTags = Partial<Omit<ItemTags, 'slot' | 'type' | 'name'>> & {
  brand?: string;
  size?: string;
  price?: number;
  notes?: string;
};

export interface TagFormProps {
  draft: TagDraft;
  onChange: (draft: TagDraft) => void;
}

/** A `<select>` of one vocabulary, where nothing chosen is a choice too. */
export interface ChoiceProps<Code extends string> {
  label: string;
  codes: readonly Code[];
  labels: Record<Code, string>;
  value: Code | '';
  onChange: (value: Code | '') => void;
}

/** Checkboxes for a tag that holds several codes at once. */
export interface ChecklistProps<Code extends string> {
  label: string;
  codes: readonly Code[];
  labels: Record<Code, string>;
  value: Code[];
  onChange: (value: Code[]) => void;
}

/** The 1–5 scale as radio buttons, with a way back to "not said". */
export interface ScaleProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

export interface MaterialRowsProps {
  rows: MaterialRow[];
  onChange: (rows: MaterialRow[]) => void;
}

/** One line on the card, left out altogether where the item has nothing to say. */
export interface TagLineProps {
  label: string;
  value: string;
}

/** What the new item form's inputs say. The form's `name`s are these. */
export interface NewItemFields {
  slot: Slot;
  type: ItemType;
  name: string;
}

/** A new item as it goes to the API: what was said, the images made, and its tags. */
export interface NewItem extends NewItemFields {
  original: Blob;
  /** Null where the background was not cut out, or the person kept the original. */
  cutout: Blob | null;
  tags: FilledTags;
}

/**
 * Where the chosen photograph has got to. One state at a time, so that a screen cannot
 * show a cut-out still being made beside the message that it failed.
 */
export type PhotoState =
  | { step: 'none' }
  | { step: 'unreadable' }
  | { step: 'reading' }
  | { step: 'cutting'; original: Blob }
  | { step: 'ready'; original: Blob; cutout: Blob | null };

export interface PhotoStepProps {
  photo: PhotoState;
  /** Whether the cut-out is what will be kept, when there is one. */
  useCutout: boolean;
  onChoose: (file: File) => void;
  onUseCutout: (use: boolean) => void;
}

export interface ColorListProps {
  colors: ItemColor[];
  onRemove: (color: ItemColor) => void;
}

export interface PreviewProps {
  image: Blob;
  alt: string;
}

/** A preview once read, with the blob it was read from. */
export interface ShownPreview {
  image: Blob;
  url: string;
}

/** Where `POST /items/upload-url` says a file goes. */
export interface UploadTarget {
  key: string;
  url: string;
}

/** One narrowing of the wardrobe: a slot, the archive, both or neither. */
export interface WardrobeFilter {
  slot: Slot | undefined;
  /** Only `archived` is ever asked for by name; no status means what is still worn. */
  status: 'archived' | undefined;
}

export interface ItemQuery extends WardrobeFilter {
  cursor?: string | undefined;
}

export interface FriendItemQuery {
  username: string;
  cursor?: string | undefined;
}

export interface ItemTileProps {
  item: Item;
}

/** A wardrobe list as the cache holds it: the pages so far, and the cursor behind each. */
export type ItemPages = InfiniteData<Page<Item>, string | undefined>;

export interface ItemSheetProps {
  item: Item;
}

export interface SharingSwitchProps {
  item: Item;
}

export interface ArchiveFormProps {
  id: string;
}

export interface ArchivedNoteProps {
  item: Item;
}

/** Empty until a reason is chosen, which is what the form refuses. */
export interface ArchiveFields {
  reason: ArchiveReason | '';
}
