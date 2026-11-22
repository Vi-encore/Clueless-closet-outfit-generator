import { useSyncExternalStore } from 'react';
import { mannequinShown, onMannequinChange, showMannequin } from './doll.utils';

/**
 * Whether dolls draw the mannequin, as this device remembers it, and the way to change it.
 * One answer for every doll on the page: hiding it under the outfit hides it in the
 * diary's calendar too.
 */
export function useMannequin(): [boolean, (shown: boolean) => void] {
  const shown = useSyncExternalStore(onMannequinChange, mannequinShown);

  return [shown, showMannequin];
}
