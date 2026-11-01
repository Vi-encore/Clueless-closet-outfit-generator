/**
 * Where the connection stands. `lost` is a connection that had been up and went away,
 * kept apart from `connecting` because only the first is news to a person reading.
 */
export type ChatStatus = 'offline' | 'connecting' | 'connected' | 'lost';

export interface Chat {
  status: ChatStatus;
}
