import { Link } from 'react-router';
import { uk } from '../i18n/uk';
import { Window } from '../shell/window';

/** Where signing in lands. Little here yet: the wardrobe is the next change's. */
export function Desktop() {
  return (
    <Window title={uk.desktop.title} closable={false}>
      <p>{uk.desktop.welcome}</p>
      <p className="mt-4">
        <Link to="/wardrobe">{uk.wardrobe.title}</Link>
      </p>
    </Window>
  );
}
