import { uk } from '../i18n/uk';
import { DialogFrame } from './dialog-frame';
import type { ErrorDialogProps } from './ui.interfaces';

/** Something went wrong, and the only thing left to do is say so. */
export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  return (
    <DialogFrame title={uk.dialog.error} message={message} icon="error" onClose={onClose}>
      <button type="button" data-initial-focus onClick={onClose}>
        {uk.dialog.ok}
      </button>
    </DialogFrame>
  );
}
