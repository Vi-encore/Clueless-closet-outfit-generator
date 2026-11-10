import { describe, expect, it } from 'vitest';
import { autoFit } from './auto-fit';
import { FIT } from './doll.constants';
import { MANNEQUIN } from './mannequin';

const { anchors } = MANNEQUIN;

/** Percent of the frame, as a placement is written. */
const percent = (fraction: number) => fraction * 100;

describe('Requirement: The doll wears the outfit', () => {
  it('Scenario: A top sits on the shoulders', () => {
    const placement = autoFit('top', anchors);
    const width = percent(anchors.shoulderWidth * FIT.top);

    expect(placement).toEqual({
      top: percent(anchors.shoulderY),
      width,
      left: 50 - width / 2,
      layer: 2,
    });
  });

  it('places a bottom from the waist, as wide as the hips allow', () => {
    const placement = autoFit('bottom', anchors);

    expect(placement?.top).toBe(percent(anchors.waistY));
    expect(placement?.width).toBe(percent(anchors.hipWidth * FIT.bottom));
  });

  it('places a one-piece and outerwear from the shoulders, and shoes at the ankles', () => {
    expect(autoFit('one_piece', anchors)?.top).toBe(percent(anchors.shoulderY));
    expect(autoFit('outerwear', anchors)?.top).toBe(percent(anchors.shoulderY));
    expect(autoFit('shoes', anchors)?.top).toBe(percent(anchors.ankleY));
    expect(autoFit('shoes', anchors)?.width).toBe(percent(anchors.feetWidth * FIT.shoes));
  });

  it('Scenario: Layers', () => {
    const layer = (slot: Parameters<typeof autoFit>[0]) => autoFit(slot, anchors)?.layer ?? 0;

    expect(layer('bottom')).toBeLessThan(layer('top'));
    expect(layer('top')).toBeLessThan(layer('outerwear'));
    expect(layer('outerwear')).toBeLessThan(layer('shoes'));
  });

  it('leaves accessories off the doll', () => {
    expect(autoFit('accessory', anchors)).toBeNull();
  });
});
