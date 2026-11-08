import { Route, Routes } from 'react-router';
import { Chat, ChatProvider, Conversation } from '../features/chat';
import { Desktop } from '../features/desktop';
import { Friends, FriendWardrobe } from '../features/friends';
import { ItemCard, NewItem, Wardrobe } from '../features/wardrobe';
import { NotFound } from '../shared/ui/not-found';
import { RequireGuest, RequireSession, SessionProvider, SignIn, SignUp } from '../features/session';
import { Shell } from './shell';

/**
 * Which screen a URL means. The router itself is mounted in `main.tsx`, so that a test
 * can hand this a `MemoryRouter` and open the application at any path.
 */
export function App() {
  return (
    <SessionProvider>
      <ChatProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route element={<RequireSession />}>
              <Route index element={<Desktop />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:username" element={<Conversation />} />
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
      </ChatProvider>
    </SessionProvider>
  );
}
