import { uk } from '../../shared/i18n/uk';
import type { BubbleProps } from './chat.interfaces';

/** One message, with how far along it is when that is not yet settled. */
export function Bubble({ message, mine, onRetry }: BubbleProps) {
  return (
    <li className={mine ? 'bubble bubble-mine' : 'bubble'}>
      {message.body}
      {message.state === 'waiting' && <small>{uk.chat.sending}</small>}
      {message.state === 'failed' && (
        <small>
          {uk.chat.notSent}{' '}
          <button type="button" onClick={onRetry}>
            {uk.chat.tryAgain}
          </button>
        </small>
      )}
    </li>
  );
}
