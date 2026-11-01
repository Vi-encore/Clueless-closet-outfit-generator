import { useNavigate } from 'react-router';
import { uk } from '../i18n/uk';

/** The bar along the bottom. Chrome for now: no window list, because there is one window. */
export function Taskbar() {
  const navigate = useNavigate();

  return (
    <nav aria-label={uk.taskbar.label} className="taskbar flex items-center gap-2">
      <button type="button" className="font-bold" onClick={() => void navigate('/')}>
        {uk.taskbar.start}
      </button>
    </nav>
  );
}
