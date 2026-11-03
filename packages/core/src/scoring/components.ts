/** The scoring components implemented so far; more arrive with the generator (step 10). */
export const COMPONENTS = ['color', 'formality'] as const;
export type ComponentName = (typeof COMPONENTS)[number];
