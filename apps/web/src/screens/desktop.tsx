import { uk } from '../i18n/uk';
import { Window } from '../shell/window';

/** Where signing in lands. Little here yet: the wardrobe is the next change's. */
export function Desktop() {
  return (
    <Window title={uk.desktop.title} closable={false}>
      <p>{uk.desktop.welcome}</p>
    </Window>
  );
}
