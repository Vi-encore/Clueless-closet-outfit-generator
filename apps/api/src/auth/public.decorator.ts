import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'auth:public';

/**
 * Opens a route to everyone.
 *
 * The guard is global, so everything is protected unless it says otherwise. That way
 * forgetting a decorator leaves a route closed rather than leaving someone's wardrobe
 * readable by strangers - the mistake fails loudly instead of silently.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
