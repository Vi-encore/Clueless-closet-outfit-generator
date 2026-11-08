export type EnumField = { enum?: string[]; items?: { enum?: string[] } };

/** The part of the exported JSON Schema a test reads: each tag's allowed values. */
export interface SchemaWithProperties {
  properties: Record<string, EnumField>;
}
