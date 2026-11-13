import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { acceptRequest, blockPerson, endRelation } from './friends.api';
import { peopleQuery } from './friends.queries';
import { uk } from '../../shared/i18n/uk';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { personName } from '../../shared/person-name';
import { Window } from '../../shared/ui/window';
import type { Asking } from './friends.interfaces';
import { useFriendAction } from './use-friend-action';
import { Row } from './row';
import { Sheet } from './sheet';
import { People } from './people';
import { FindPerson } from './find-person';

/**
 * One screen, because these are one list seen from different sides: somebody moves from
 * asked to friend to blocked, and a person should watch that happen.
 *
 * Every action asks for all of it again rather than editing it in place. Accepting a
 * request changes two lists and blocking can change three, and working out which here
 * would be a second copy of rules the API already holds.
 */
export function Friends() {
  const { data: people, error } = useQuery(peopleQuery());
  const { act, busy, failed, dismiss } = useFriendAction();
  const [asking, setAsking] = useState<Asking | null>(null);

  const confirmed = () => {
    if (asking === null) {
      return;
    }

    const { username } = asking.person;

    setAsking(null);
    act(() => (asking.kind === 'remove' ? endRelation(username) : blockPerson(username)));
  };

  return (
    <Window title={uk.friends.title} parent="/" wide>
      <div className="flex flex-col gap-4">
        <FindPerson />
        {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
        {people !== undefined && (
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
                  {people.friends.map(({ user }) => (
                    <Row
                      key={user.id}
                      name={
                        <Link
                          to={`/friends/${user.username}`}
                          state={{ name: personName(user) }}
                          className="person-link"
                        >
                          {personName(user)}
                        </Link>
                      }
                    >
                      {/* The name leads here too, but a name does not look like something
                          to press, and on a phone nothing shows that it is. */}
                      <Link
                        to={`/friends/${user.username}`}
                        state={{ name: personName(user) }}
                        className="action"
                        aria-label={`${uk.friends.openWardrobe}: ${personName(user)}`}
                      >
                        {uk.friends.openWardrobe}
                      </Link>
                      <Link
                        to={`/chat/${user.username}`}
                        state={{ name: personName(user) }}
                        className="action"
                        aria-label={`${uk.chat.write}: ${personName(user)}`}
                      >
                        {uk.chat.write}
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`${uk.friends.remove}: ${personName(user)}`}
                        onClick={() => setAsking({ kind: 'remove', person: user })}
                      >
                        {uk.friends.remove}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`${uk.friends.block}: ${personName(user)}`}
                        onClick={() => setAsking({ kind: 'block', person: user })}
                      >
                        {uk.friends.block}
                      </button>
                    </Row>
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
            {people.blocked.length > 0 && (
              <Sheet title={uk.friends.blocked}>
                <People>
                  {people.blocked.map(({ user }) => (
                    <Row key={user.id} name={personName(user)}>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`${uk.friends.unblock}: ${personName(user)}`}
                        onClick={() => act(() => endRelation(user.username))}
                      >
                        {uk.friends.unblock}
                      </button>
                    </Row>
                  ))}
                </People>
              </Sheet>
            )}
          </>
        )}
      </div>
      {asking !== null && (
        <ConfirmDialog
          message={
            asking.kind === 'remove'
              ? uk.friends.confirmRemove(personName(asking.person))
              : uk.friends.confirmBlock(personName(asking.person))
          }
          confirmLabel={asking.kind === 'remove' ? uk.friends.remove : uk.friends.block}
          onConfirm={confirmed}
          onCancel={() => setAsking(null)}
        />
      )}
      {failed && <ErrorDialog message={uk.errors.unavailable} onClose={dismiss} />}
    </Window>
  );
}
