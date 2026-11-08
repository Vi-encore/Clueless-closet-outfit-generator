import { Link } from 'react-router';
import { uk } from '../i18n/uk';
import { Window } from './window';

export function NotFound() {
  return (
    <Window title={uk.notFound.title}>
      <p>{uk.notFound.message}</p>
      <p className="mt-4">
        <Link to="/">{uk.notFound.home}</Link>
      </p>
    </Window>
  );
}
