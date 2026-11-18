import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useSession } from '../session';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { askToBeFriends } from './friends.api';
import { friendKeys } from './friends.constants';
import { describeAskFailure } from './friends.utils';

/**
 * What an invitation link (`/friends?add=<username>`) opens: an offer to ask that person,
 * which sends nothing until it is pressed. A link someone forwarded, or opened by mistake,
 * must not ask on anybody's behalf.
 *
 * It names the person from the link and does not ask the API who that is: the API would
 * answer somebody who blocked you as readily as anybody, and the difference between
 * "blocked you" and "does not exist" is what the search keeps to itself. Pressing gets the
 * same answer as typing the name would.
 */
export function InviteOffer() {
  const [params, setParams] = useSearchParams();
  const { state } = useSession();
  const queryClient = useQueryClient();
  const username = params.get('add');
  // `replace`, so that going back does not open the offer again.
  const close = () => {
    setParams(
      (now) => {
        now.delete('add');

        return now;
      },
      { replace: true },
    );
  };
  const ask = useMutation({
    mutationFn: (name: string) => askToBeFriends(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: friendKeys.all });
      close();
    },
  });

  if (username === null || username === '' || state.status !== 'signed-in') {
    return null;
  }

  if (username === state.account.username) {
    return (
      <section className="sheet flex flex-col gap-2">
        <p>{uk.friends.ownLink}</p>
        <button type="button" className="self-start" onClick={close}>
          {uk.friends.understood}
        </button>
      </section>
    );
  }

  return (
    <section className="sheet flex flex-col gap-2">
      <p>{uk.friends.inviteOffer(username)}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="action"
          disabled={ask.isPending}
          onClick={() => ask.mutate(username)}
        >
          {uk.friends.sendRequest}
        </button>
        <button type="button" disabled={ask.isPending} onClick={close}>
          {uk.friends.notNow}
        </button>
      </div>
      {ask.isError && (
        <ErrorDialog message={describeAskFailure(ask.error)} onClose={() => ask.reset()} />
      )}
    </section>
  );
}
