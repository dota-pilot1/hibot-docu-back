import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface TaskUpdatedPayload {
  taskId: number;
  title: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  previousStatus: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
  assigneeId?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tasks',
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TasksGateway.name);
  private connectedClients: Set<string> = new Set();

  handleConnection(client: Socket) {
    this.logger.log(`[Tasks] Client connected: ${client.id}`);
    this.connectedClients.add(client.id);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[Tasks] Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * 모든 클라이언트에게 업무 업데이트 브로드캐스트
   */
  broadcastTaskUpdate(data: TaskUpdatedPayload) {
    this.logger.log(
      `[Tasks] Broadcasting task update: ${data.taskId} -> ${data.status}`,
    );
    this.server.emit('taskUpdated', data);
  }

  /**
   * 업무 삭제 브로드캐스트
   */
  broadcastTaskDeleted(taskId: number) {
    this.logger.log(`[Tasks] Broadcasting task deleted: ${taskId}`);
    this.server.emit('taskDeleted', { taskId });
  }

  /**
   * 업무 생성 브로드캐스트
   */
  broadcastTaskCreated(data: TaskUpdatedPayload) {
    this.logger.log(`[Tasks] Broadcasting task created: ${data.taskId}`);
    this.server.emit('taskCreated', data);
  }

  /**
   * 연결된 클라이언트 수 확인
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
