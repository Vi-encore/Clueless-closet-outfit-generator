import { useId, useState } from 'react';
import { useSession } from '../session';
import { uk } from '../../shared/i18n/uk';
import type { ShareOutcome } from '../../shared/platform/platform.interfaces';
import { shareLink } from '../../shared/platform/platform.utils';
import { inviteLinkFor } from './friends.utils';

/**
 * A link to the person signed in, to send to somebody who should ask them. Through the
 * phone's share sheet where there is one: that is where people send each other things.
 */
export function InviteLink() {
  const { state } = useSession();
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const fieldId = useId();

  if (state.status !== 'signed-in') {
    return null;
  }

  const url = inviteLinkFor(state.account.username, window.location.origin);
  const share = () => {
    void shareLink({ title: 'Clueless Closet', text: uk.friends.inviteText, url }).then(setOutcome);
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="self-start" onClick={share}>
        {uk.friends.shareLink}
      </button>
      {outcome === 'copied' && <output>{uk.friends.copied}</output>}
      {outcome === 'unavailable' && (
        <div className="field-row-stacked">
          <label htmlFor={fieldId}>{uk.friends.copyByHand}</label>
          <input
            id={fieldId}
            type="text"
            readOnly
            value={url}
            onFocus={(event) => event.target.select()}
          />
        </div>
      )}
    </div>
  );
}
