import type { InputHTMLAttributes, ReactNode } from 'react';

export interface WindowProps {
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

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export interface DialogFrameProps {
  title: string;
  message: string;
  /** Which of the Windows icons: the red cross or the question mark. */
  icon: 'error' | 'question';
  onClose: () => void;
  /** The buttons. The one marked `data-initial-focus` takes the focus on arrival. */
  children: ReactNode;
}

export interface ErrorDialogProps {
  message: string;
  onClose: () => void;
}

export interface ConfirmDialogProps {
  message: string;
  /** What pressing yes does, named as the button that started this was named. */
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Router state from a screen that already knew a person's name, so the next one need not ask. */
export interface NamedState {
  name?: string;
}

export interface CountBadgeProps {
  count: number;
  /** What the count is of, in words: `uk.chat.unread`, say. */
  label: (count: number) => string;
}
