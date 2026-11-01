import { Route, Routes } from 'react-router';
import { Desktop } from './screens/desktop';
import { NotFound } from './screens/not-found';
import { SignIn } from './screens/sign-in';
import { SignUp } from './screens/sign-up';
import { Shell } from './shell/shell';

/**
 * Which screen a URL means. The router itself is mounted in `main.tsx`, so that a test
 * can hand this a `MemoryRouter` and open the application at any path.
 */
export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Desktop />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
