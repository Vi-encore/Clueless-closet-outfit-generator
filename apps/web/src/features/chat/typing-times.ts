/** How often to tell somebody you are typing, however fast you type. */
export const TYPING_EVERY = 3000;

/**
 * How long "typing…" stays without another word. Longer than `TYPING_EVERY`, so that it
 * holds steady while somebody keeps typing, and fades by itself when they stop or their
 * connection drops: nobody ever sends "stopped typing".
 */
export const TYPING_FADES_AFTER = 5000;
