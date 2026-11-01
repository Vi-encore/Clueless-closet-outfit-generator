import { Route, Routes } from 'react-router';
import { Desktop } from './screens/desktop';
import { FriendWardrobe } from './screens/friend-wardrobe';
import { Friends } from './screens/friends';
import { ItemCard } from './screens/item-card';
import { NewItem } from './screens/new-item';
import { NotFound } from './screens/not-found';
import { SignIn } from './screens/sign-in';
import { SignUp } from './screens/sign-up';
import { Wardrobe } from './screens/wardrobe';
import { SessionProvider } from './session/session.provider';
import { RequireGuest, RequireSession } from './shell/require-session';
import { Shell } from './shell/shell';

/**
 * Which screen a URL means. The router itself is mounted in `main.tsx`, so that a test
 * can hand this a `MemoryRouter` and open the application at any path.
 */
export function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route element={<RequireSession />}>
            <Route index element={<Desktop />} />
            <Route path="friends" element={<Friends />} />
            <Route path="friends/:username" element={<FriendWardrobe />} />
            <Route path="wardrobe" element={<Wardrobe />} />
            <Route path="wardrobe/new" element={<NewItem />} />
            <Route path="wardrobe/:id" element={<ItemCard />} />
          </Route>
          <Route element={<RequireGuest />}>
            <Route path="sign-in" element={<SignIn />} />
            <Route path="sign-up" element={<SignUp />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}
