import { useEffect, useId, useRef } from 'react';
import { uk } from '../i18n/uk';

interface ErrorDialogProps {
  message: string;
  onClose: () => void;
}

/**
 * The little window Windows opens when something went wrong.
 *
 * A `div` with the role rather than `<dialog>`: `showModal` is what would make that one
 * modal, and jsdom has none, so the scenarios about it could not run. Focus goes to OK
 * on arrival and back where it was on leaving, which is what lets Enter or Escape dismiss
 * it and then carry straight on with the form.
 */
export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const ok = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const before = document.activeElement;

    ok.current?.focus();

    return () => {
      if (before instanceof HTMLElement) {
        before.focus();
      }
    };
  }, []);

  // On the document, so that Escape works wherever a click has left the focus.
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="window w-full max-w-sm"
      >
        <div className="title-bar">
          <h2 id={titleId} className="title-bar-text">
            {uk.dialog.error}
          </h2>
          <div className="title-bar-controls">
            <button
              type="button"
              className="close"
              aria-label={uk.window.close}
              onClick={onClose}
            />
          </div>
        </div>
        <div className="window-body">
          <div className="flex items-center gap-4">
            <span className="dialog-icon" aria-hidden="true" />
            <p id={messageId}>{message}</p>
          </div>
          <div className="mt-4 flex justify-center">
            <button ref={ok} type="button" onClick={onClose}>
              {uk.dialog.ok}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
