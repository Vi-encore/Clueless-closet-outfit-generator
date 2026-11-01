import { uk } from '../i18n/uk';
import { DialogFrame } from './dialog-frame';

interface ConfirmDialogProps {
  message: string;
  /** What pressing yes does, named as the button that started this was named. */
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Are you sure, before something that cannot be taken back with one press.
 *
 * Focus starts on Cancel, and that is the point of having this at all: Enter, pressed
 * out of habit, must not be what removes a friend.
 */
export function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <DialogFrame title={uk.dialog.confirm} message={message} icon="question" onClose={onCancel}>
      <button type="button" onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button type="button" data-initial-focus onClick={onCancel}>
        {uk.dialog.cancel}
      </button>
    </DialogFrame>
  );
}
