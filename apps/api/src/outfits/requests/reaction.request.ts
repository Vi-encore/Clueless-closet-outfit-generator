import { z } from 'zod';

export const REACTIONS = ['like', 'dislike'] as const;
export type Reaction = (typeof REACTIONS)[number];

export const reactionSchema = z.enum(REACTIONS);

/** What `PUT /outfits/:id/reaction` accepts: a reaction, or null to take it back. */
export const reactionRequestSchema = z.object({
  reaction: reactionSchema.nullable(),
});

export type ReactionRequest = z.infer<typeof reactionRequestSchema>;
