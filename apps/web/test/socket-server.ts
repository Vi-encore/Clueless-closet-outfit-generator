import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server, type Socket } from 'socket.io';

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

  async start(): Promise<void> {
    this.http = createServer();
    this.io = new Server(this.http);
    this.io.use((socket, next) => {
      const token: unknown = socket.handshake.auth.token;

      this.tokens.push(token);
      next(this.accepts(token) ? undefined : new Error('unauthorized'));
    });
    this.io.on('connection', (socket) => this.onConnection(socket));

    await new Promise<void>((resolve) => {
      this.http?.listen(0, resolve);
    });
  }

  get host(): string {
    const address = this.http?.address() as AddressInfo | undefined;

    return `localhost:${address?.port}`;
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

  /** Back to accepting anybody, with nothing remembered. */
  reset(): void {
    this.tokens = [];
    this.accepts = () => true;
    this.onConnection = () => {};
    this.io?.disconnectSockets(true);
  }

  async stop(): Promise<void> {
    await this.io?.close();
  }
}

export const socketServer = new SocketServer();
