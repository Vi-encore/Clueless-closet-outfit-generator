import { StandardSchemaValidationPipe, type ArgumentMetadata } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { scoreOutfitRequestSchema } from '../outfits/score-outfit.request.js';
import { validationException } from './validation-exception.js';

const pipe = new StandardSchemaValidationPipe({ exceptionFactory: validationException });

const metadata: ArgumentMetadata = { type: 'body', schema: scoreOutfitRequestSchema };

describe('Requirement: Unknown fields are dropped', () => {
  /**
   * Checked on the pipe rather than over HTTP: what the scenario is about is the value the
   * handler receives, and by the time a response comes back the stripped field is gone
   * either way, so a request could not tell the two apart.
   */
  it('Scenario: Extra field removed', async () => {
    const body = {
      occasion: { code: 'work', targetFormality: 3 },
      items: [{ id: 'b1', slot: 'top', type: 'blouse' }],
      isAdmin: true,
    };

    const handled = await pipe.transform(body, metadata);

    expect(handled).not.toHaveProperty('isAdmin');
    expect(handled.items).toHaveLength(1);
  });
});
