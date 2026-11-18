import type { ShareOutcome, SharedLink } from './platform.interfaces';

/**
 * Hands a link on in the best way this device allows: the system's share sheet on a
 * phone, the clipboard elsewhere, and nothing where neither works, which the caller then
 * shows to copy by hand.
 *
 * The one place that touches `navigator.share` and the clipboard: a native shell would
 * replace this module and nothing else (architecture.md, platform wrappers).
 */
export async function shareLink(link: SharedLink): Promise<ShareOutcome> {
  const { navigator } = window;

  if (typeof navigator.share === 'function' && (navigator.canShare?.(link) ?? true)) {
    try {
      await navigator.share(link);

      return 'shared';
    } catch (error) {
      // Closing the sheet is an answer. Anything else - a browser that refused this
      // share, say - falls through to the clipboard.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(link.url);

      return 'copied';
    } catch {
      // Refused, which some browsers do even from a press: shown to copy by hand.
    }
  }

  return 'unavailable';
}
