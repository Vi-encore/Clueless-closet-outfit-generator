import type { TagLineProps } from './wardrobe.interfaces';

/** A name and its value, or nothing at all where the item has no value to give. */
export function TagLine({ label, value }: TagLineProps) {
  if (value === '') {
    return null;
  }

  return (
    <>
      <dt>{label}</dt>
      <dd aria-label={label}>{value}</dd>
    </>
  );
}
