import { useId, type ReactNode } from 'react';
import { uk } from '../i18n/uk';
import { useClose } from './use-close';

interface WindowProps {
  title: string;
  /** False on a screen with nothing behind it to return to. */
  closable?: boolean;
  /** For a screen that lays things out, rather than one that asks a question. */
  wide?: boolean;
  /** Where this screen belongs, for a visible way back and for arriving by a direct link. */
  parent?: string;
  /**
   * Takes all the height there is, and leaves scrolling to something inside it. Otherwise
   * the window scrolls too, and a screen that scrolls within itself shows two bars.
   */
  fills?: boolean;
  children: ReactNode;
}

/**
 * The frame every screen is drawn into. A "window" is page chrome rather than a thing
 * that moves: closing one is going back, so links, the back button and a phone all
 * work without anything having to know about windows.
 *
 * Full height on a phone, where a screen is the window, and a centred box from `md:`.
 * The classes come from 98.css and the sizes from Tailwind utilities, which win only
 * because 98.css sits in the `components` layer - see index.css.
 */
export function Window({
  title,
  closable = true,
  wide = false,
  parent,
  fills = false,
  children,
}: WindowProps) {
  const titleId = useId();
  const close = useClose(parent);

  return (
    <section
      aria-labelledby={titleId}
      className={`window flex h-full w-full flex-col max-md:shadow-none md:h-auto ${wide ? 'md:max-w-3xl' : 'md:max-w-md'} ${fills ? 'md:h-full' : ''}`}
    >
      <div className="title-bar">
        <h1 id={titleId} className="title-bar-text">
          {title}
        </h1>
        {closable && (
          <div className="title-bar-controls">
            {/* `close` and not just the label: 98.css draws the cross for an
                aria-label of exactly "Close", and this one is in Ukrainian. */}
            <button type="button" className="close" aria-label={uk.window.close} onClick={close} />
          </div>
        )}
      </div>
      <div
        className={`window-body flex-1 ${fills ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-auto'}`}
      >
        {parent !== undefined && (
          <button type="button" className="mb-4 self-start" onClick={close}>
            {uk.window.back}
          </button>
        )}
        {children}
      </div>
    </section>
  );
}
