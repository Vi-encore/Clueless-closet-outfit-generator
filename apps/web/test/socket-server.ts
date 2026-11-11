import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server, type Socket } from 'socket.io';

const LOOPBACK = '127.0.0.1';

/**
 * A real Socket.IO server in the test process, standing in for the gateway.
 *
 * Real rather than a fake because what matters here is the protocol's behaviour: that a
 * refused handshake is not retried, that a dropped line is, that an acknowledgement
 * arrives. A fake would only repeat what the author believed about those.
 */
class SocketServer {
  private http: HttpServer | null = null;
  private io: Server | null = null;

  /** Every token a handshake presented, accepted or not. */
  tokens: unknown[] = [];

  /** Which tokens to accept. Everything, unless a test says otherwise. */
  accepts: (token: unknown) => boolean = () => true;

  /** Runs for each connection, for a test that wants to answer events. */
  onConnection: (socket: Socket) => void = () => {};

  /**
   * Every open line beneath the sockets, kept so that `reset` can cut them too.
   *
   * A socket exists only once its handshake is through, but the line it travels on opens
   * first. A test that ends before its handshake does leaves that handshake on its way,
   * and it lands in the next test as somebody connected: `connected` says 1 before the new
   * test's own client is there, and whatever the test then says reaches nobody it meant.
   */
  private lines = new Set<Socket['conn']>();

  async start(): Promise<void> {
    this.http = createServer();
    this.io = new Server(this.http);
    this.io.engine.on('connection', (line: Socket['conn']) => {
      this.lines.add(line);
      line.on('close', () => this.lines.delete(line));
    });
    this.io.use((socket, next) => {
      const token: unknown = socket.handshake.auth.token;

      this.tokens.push(token);
      next(this.accepts(token) ? undefined : new Error('unauthorized'));
    });
    this.io.on('connection', (socket) => this.onConnection(socket));

    // An address rather than `localhost`, so that connecting looks nothing up. On Windows a
    // lookup waits in the same small thread pool as the lookups of `api.test`, which go to
    // the real DNS and can take seconds to fail. A client stuck behind them connects after
    // the test has stopped waiting, and the test fails for something it never described.
    await new Promise<void>((resolve) => {
      this.http?.listen(0, LOOPBACK, resolve);
    });
  }

  get host(): string {
    const address = this.http?.address() as AddressInfo | undefined;

    return `${LOOPBACK}:${address?.port}`;
  }

  get url(): string {
    return `http://${this.host}`;
  }

  get connected(): number {
    return this.io?.of('/').sockets.size ?? 0;
  }

  /** Says something to everybody connected, as the gateway would. */
  emit(event: string, payload: unknown): void {
    this.io?.emit(event, payload);
  }

  /** Cuts the line as a network would, which a client is meant to come back from. */
  dropConnections(): void {
    for (const socket of this.io?.of('/').sockets.values() ?? []) {
      socket.conn.close();
    }
  }

  /** Back to accepting anybody, with nothing remembered. */
  reset(): void {
    this.tokens = [];
    this.accepts = () => true;
    this.onConnection = () => {};
    this.io?.disconnectSockets(true);

    for (const line of this.lines) {
      line.close();
    }
  }

  async stop(): Promise<void> {
    await this.io?.close();
  }
}

export const socketServer = new SocketServer();
