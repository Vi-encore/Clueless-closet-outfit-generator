import { useEffect, useId, useRef } from 'react';
import { uk } from '../i18n/uk';
import type { DialogFrameProps } from './ui.interfaces';

/**
 * The little window Windows opens to stop you and say something.
 *
 * A `div` with the role rather than `<dialog>`: `showModal` is what would make that one
 * modal, and jsdom has none, so the scenarios about it could not run. Focus goes in on
 * arrival and back where it was on leaving, which is what lets the keyboard answer it
 * and then carry straight on.
 */
export function DialogFrame({ title, message, icon, onClose, children }: DialogFrameProps) {
  const titleId = useId();
  const messageId = useId();
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement;

    frame.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus();

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
        ref={frame}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="window w-full max-w-sm"
      >
        <div className="title-bar">
          <h2 id={titleId} className="title-bar-text">
            {title}
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
            <span className={`dialog-icon dialog-icon-${icon}`} aria-hidden="true" />
            {/* Pre-line, so that a message of several lines - one per refused field - keeps them. */}
            <p id={messageId} className="whitespace-pre-line">
              {message}
            </p>
          </div>
          <div className="mt-4 flex justify-center gap-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
