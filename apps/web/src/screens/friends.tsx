import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { hasStatus } from '../api/api-error';
import type { Relation } from '../api/api.interfaces';
import {
  acceptRequest,
  askToBeFriends,
  endRelation,
  listBlocked,
  listFriends,
  listSentRequests,
  listWaitingRequests,
} from '../api/friends';
import { uk } from '../i18n/uk';
import { ErrorDialog } from '../shell/error-dialog';
import { Field } from '../shell/field';
import { personName } from '../shell/person-name';
import { useFormSubmit } from '../shell/use-form-submit';
import { useLoad } from '../shell/use-load';
import { Window } from '../shell/window';

function loadPeople() {
  return Promise.all([
    listFriends(),
    listWaitingRequests(),
    listSentRequests(),
    listBlocked(),
  ]).then(([friends, waiting, sent, blocked]) => ({ friends, waiting, sent, blocked }));
}

/**
 * One screen, because these are one list seen from different sides: somebody moves from
 * asked to friend to blocked, and a person should watch that happen.
 *
 * Every action asks for all of it again rather than editing it in place. Accepting a
 * request changes two lists and blocking can change three, and working out which here
 * would be a second copy of rules the API already holds.
 */
export function Friends() {
  const { value: people, error, reload } = useLoad(loadPeople);
  const { act, busy, failure, dismiss } = useAction(reload);

  return (
    <Window title={uk.friends.title} parent="/" wide>
      <div className="flex flex-col gap-4">
        <FindPerson onAsked={reload} />
        {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
        {people !== null && (
          <>
            {/* First, because this is what somebody came here for. */}
            {people.waiting.length > 0 && (
              <Sheet title={uk.friends.waiting}>
                <People>
                  {people.waiting.map(({ user }) => (
                    <Row key={user.id} name={personName(user)}>
                      <button
                        type="button"
                        className="action"
                        disabled={busy}
                        aria-label={`${uk.friends.accept}: ${personName(user)}`}
                        onClick={() => act(() => acceptRequest(user.username))}
                      >
                        {uk.friends.accept}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`${uk.friends.decline}: ${personName(user)}`}
                        onClick={() => act(() => endRelation(user.username))}
                      >
                        {uk.friends.decline}
                      </button>
                    </Row>
                  ))}
                </People>
              </Sheet>
            )}
            <Sheet title={uk.friends.yours}>
              {people.friends.length === 0 ? (
                <p>{uk.friends.none}</p>
              ) : (
                <People>
                  {people.friends.map((friend) => (
                    <FriendRow key={friend.user.id} friend={friend} />
                  ))}
                </People>
              )}
            </Sheet>
            {people.sent.length > 0 && (
              <Sheet title={uk.friends.sent}>
                <People>
                  {people.sent.map(({ user }) => (
                    <Row key={user.id} name={personName(user)}>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`${uk.friends.withdraw}: ${personName(user)}`}
                        onClick={() => act(() => endRelation(user.username))}
                      >
                        {uk.friends.withdraw}
                      </button>
                    </Row>
                  ))}
                </People>
              </Sheet>
            )}
          </>
        )}
      </div>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
    </Window>
  );
}

/** One press of a button on a row: while it runs, and what to show if it fails. */
function useAction(onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const act = (action: () => Promise<unknown>) => {
    setBusy(true);
    action()
      .then(onDone, () => setFailure(uk.errors.unavailable))
      .finally(() => setBusy(false));
  };

  return { act, busy, failure, dismiss: () => setFailure(null) };
}

/** A person on the left and what can be done about them on the right. */
function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <span>{name}</span>
      <span className="flex flex-wrap gap-2">{children}</span>
    </li>
  );
}

function FriendRow({ friend: { user } }: { friend: Relation }) {
  return (
    <li>
      <Link to={`/friends/${user.username}`}>{personName(user)}</Link>
    </li>
  );
}

function Sheet({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="sheet flex flex-col gap-2">
      <h2 id={titleId} className="font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function People({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-2">{children}</ul>;
}

function describe(error: unknown): string {
  // Unknown, or the person has blocked this one: the API answers both with 404 on
  // purpose, and a more helpful message here would quietly undo that. A name that could
  // not exist answers 400, and to the person typing it is the same thing.
  return hasStatus(error, 404) || hasStatus(error, 400) ? uk.friends.nobody : uk.errors.unavailable;
}

function FindPerson({ onAsked }: { onAsked: () => void }) {
  const [username, setUsername] = useState('');
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<{ username: string }>(async () => {
    await askToBeFriends(username.trim());
    setUsername('');
    onAsked();
  }, describe);

  return (
    <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={onSubmit}>
      <div className="sm:flex-1">
        <Field
          label={uk.friends.username}
          name="username"
          type="text"
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </div>
      <button type="submit" className="action" disabled={pending}>
        {uk.friends.ask}
      </button>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
    </form>
  );
}
