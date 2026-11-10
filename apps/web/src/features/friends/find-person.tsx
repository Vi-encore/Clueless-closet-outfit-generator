import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { askToBeFriends } from './friends.api';
import { friendKeys } from './friends.constants';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { Field } from '../../shared/ui/field';
import { useFormSubmit } from '../../shared/hooks/use-form-submit';
import type { AskFields } from './friends.interfaces';
import { describeAskFailure } from './friends.utils';

export function FindPerson() {
  const [username, setUsername] = useState('');
  const queryClient = useQueryClient();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<AskFields>(async () => {
    await askToBeFriends(username.trim());
    setUsername('');
    await queryClient.invalidateQueries({ queryKey: friendKeys.all });
  }, describeAskFailure);

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
