/** What is handed to the system's share sheet. */
export interface SharedLink {
  title: string;
  text: string;
  url: string;
}

/**
 * How a share went: through the system's sheet, onto the clipboard, nowhere because the
 * person closed the sheet, or nowhere because the device offers neither.
 */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unavailable';
