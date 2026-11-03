import { useNavigate } from 'react-router';
import { uk } from '../shared/i18n/uk';
import { useSession } from '../session/use-session';

/** The bar along the bottom. Chrome for now: no window list, because there is one window. */
export function Taskbar() {
  const navigate = useNavigate();
  const { state, signOut } = useSession();

  return (
    <nav aria-label={uk.taskbar.label} className="taskbar flex items-center justify-between gap-2">
      <button type="button" className="font-bold" onClick={() => void navigate('/')}>
        {uk.taskbar.start}
      </button>
      {state.status === 'signed-in' && (
        <button type="button" onClick={() => void signOut()}>
          {uk.taskbar.signOut}
        </button>
      )}
    </nav>
  );
}
