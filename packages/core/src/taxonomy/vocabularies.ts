/**
 * Tag vocabularies — the single source of truth for describing items.
 *
 * Types, validation, the JSON Schema and form options are all derived from these
 * arrays. Values are codes; human-readable (Ukrainian) labels live in the UI dictionary.
 * Adding a code is safe; renaming one later means migrating stored data.
 */

export const SLOTS = ['top', 'bottom', 'one_piece', 'outerwear', 'shoes', 'accessory'] as const;
export type Slot = (typeof SLOTS)[number];

export const TYPES_BY_SLOT = {
  top: [
    't_shirt',
    'long_sleeve',
    'blouse',
    'shirt',
    'tank_top',
    'crop_top',
    'bodysuit',
    'sweater',
    'sweatshirt',
    'hoodie',
  ],
  bottom: ['jeans', 'trousers', 'skirt', 'shorts', 'leggings', 'sweatpants'],
  one_piece: ['dress', 'jumpsuit', 'playsuit', 'overalls'],
  outerwear: [
    'coat',
    'trench_coat',
    'jacket',
    'denim_jacket',
    'leather_jacket',
    'blazer',
    'puffer',
    'cardigan',
  ],
  shoes: ['sneakers', 'boots', 'ankle_boots', 'heels', 'flats', 'loafers', 'sandals', 'mules'],
  accessory: ['bag', 'belt', 'scarf', 'hat', 'jewelry', 'sunglasses'],
} as const satisfies Record<Slot, readonly string[]>;

export type ItemType = (typeof TYPES_BY_SLOT)[Slot][number];

/** Every item type across all slots. */
export const ITEM_TYPES: readonly ItemType[] = SLOTS.flatMap((slot) => TYPES_BY_SLOT[slot]);

export function typeBelongsToSlot(type: ItemType, slot: Slot): boolean {
  // Widened on purpose: `includes` on a tuple of literals only accepts those literals.
  const typesOfSlot: readonly ItemType[] = TYPES_BY_SLOT[slot];
  return typesOfSlot.includes(type);
}

export const PATTERNS = [
  'solid',
  'stripes',
  'checks',
  'polka_dots',
  'floral',
  'animal',
  'geometric',
  'print',
] as const;
export type Pattern = (typeof PATTERNS)[number];

/** The texture visible in a photo — not the composition (see MATERIALS). */
export const FABRIC_TYPES = [
  'denim',
  'knit',
  'jersey',
  'satin',
  'chiffon',
  'lace',
  'corduroy',
  'velvet',
  'tweed',
  'leather',
  'suede',
  'poplin',
  'twill',
  'sequin',
  'fleece',
] as const;
export type FabricType = (typeof FABRIC_TYPES)[number];

/** Composition from the care label. */
export const MATERIALS = [
  'cotton',
  'linen',
  'wool',
  'cashmere',
  'silk',
  'viscose',
  'lyocell',
  'modal',
  'polyester',
  'polyamide',
  'elastane',
  'acrylic',
  'leather',
  'faux_leather',
] as const;
export type Material = (typeof MATERIALS)[number];

export const FITS = ['fitted', 'regular', 'oversized'] as const;
export type Fit = (typeof FITS)[number];

/** `cropped` / `regular` / `long` for tops and trousers; `mini` / `midi` / `maxi` for skirts and dresses. */
export const LENGTHS = ['cropped', 'regular', 'long', 'mini', 'midi', 'maxi'] as const;
export type Length = (typeof LENGTHS)[number];

export const RISES = ['low', 'mid', 'high'] as const;
export type Rise = (typeof RISES)[number];

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const STYLES = [
  'classic',
  'minimal',
  'romantic',
  'street',
  'sporty',
  'preppy',
  'boho',
  'glam',
  'edgy',
] as const;
export type Style = (typeof STYLES)[number];

export const OCCASIONS = ['casual', 'work', 'party', 'date', 'sport', 'travel', 'home'] as const;
export type OccasionCode = (typeof OCCASIONS)[number];

export const COLOR_FAMILIES = [
  'black',
  'white',
  'grey',
  'beige',
  'brown',
  'denim',
  'navy',
  'blue',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
] as const;
export type ColorFamily = (typeof COLOR_FAMILIES)[number];

/** Warmth and formality use the same 1–5 scale. */
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;
