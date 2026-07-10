import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LogsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-run')
  handleJoinRun(
    @MessageBody() runId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`run-${runId}`);
    console.log(`Client ${client.id} joined room run-${runId}`);
    client.emit('joined', { runId });
  }

  emitLogLine(runId: string, line: string) {
    this.server.to(`run-${runId}`).emit('log-line', line);
  }

  emitStatusUpdate(runId: string, status: string) {
    this.server.to(`run-${runId}`).emit('status-update', { status });
  }
}