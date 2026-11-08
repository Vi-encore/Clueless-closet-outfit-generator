export type EnumField = { enum?: string[]; items?: { enum?: string[] } };

/** The part of the exported JSON Schema a test reads: each tag's allowed values. */
export interface SchemaWithProperties {
  properties: Record<string, EnumField>;
}

/** A run of identical pixels, for building an image a test can reason about. */
export interface PixelRun {
  rgba: [number, number, number, number];
  count: number;
}
