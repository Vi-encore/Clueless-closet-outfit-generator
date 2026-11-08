import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { anItem } from '../../../../test/api-fixtures';
import { uk } from '../../../shared/i18n/uk';
import { Doll } from './doll';

const coat = anItem({
  id: 'coat',
  name: 'Coat',
  slot: 'outerwear',
  type: 'coat',
  cutoutUrl: 'https://s.test/coat.webp',
});
const blouse = anItem({
  id: 'blouse',
  name: 'Blouse',
  slot: 'top',
  type: 'blouse',
  cutoutUrl: 'https://s.test/blouse.webp',
});
const jeans = anItem({
  id: 'jeans',
  name: 'Jeans',
  slot: 'bottom',
  type: 'jeans',
  cutoutUrl: 'https://s.test/jeans.webp',
});
const boots = anItem({
  id: 'boots',
  name: 'Boots',
  slot: 'shoes',
  type: 'boots',
  cutoutUrl: 'https://s.test/boots.webp',
});

describe('Requirement: The doll wears the outfit', () => {
  it('Scenario: Proportions are kept', () => {
    render(<Doll items={[blouse, jeans]} />);

    const image = screen.getByRole('img', { name: 'Blouse' });

    expect(image.style.width).not.toBe('');
    expect(image.style.left).not.toBe('');
    expect(image.style.top).not.toBe('');
    expect(image.style.height).toBe('');
  });

  it('Scenario: Layers', () => {
    render(<Doll items={[coat, blouse, jeans, boots]} />);

    const depth = (name: string) => Number(screen.getByRole('img', { name }).style.zIndex);

    expect(depth('Jeans')).toBeLessThan(depth('Blouse'));
    expect(depth('Blouse')).toBeLessThan(depth('Coat'));
    expect(depth('Coat')).toBeLessThan(depth('Boots'));
  });

  it('Scenario: No cut-out', () => {
    const photographed = anItem({
      id: 'skirt',
      name: 'Skirt',
      slot: 'bottom',
      type: 'skirt',
      photoUrl: 'https://s.test/skirt.webp',
    });

    render(<Doll items={[blouse, photographed]} />);

    const doll = screen.getByRole('figure', { name: uk.outfits.doll });
    const beside = screen.getByRole('list', { name: uk.outfits.notOnDoll });
    expect(within(beside).getByRole('img', { name: 'Skirt' })).toBeTruthy();
    expect(within(doll).queryByRole('img', { name: 'Skirt' })).toBeNull();
    expect(within(doll).getByRole('img', { name: 'Blouse' })).toBeTruthy();
  });
});
