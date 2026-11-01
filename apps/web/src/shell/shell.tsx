import { Outlet } from 'react-router';
import { Taskbar } from './taskbar';

/** The desktop behind every screen: the plaid, the screen itself, and the taskbar. */
export function Shell() {
  return (
    <div className="desktop flex h-dvh flex-col">
      <main className="flex min-h-0 flex-1 items-start justify-center overflow-auto md:items-center md:p-8">
        <Outlet />
      </main>
      <Taskbar />
    </div>
  );
}
