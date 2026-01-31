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
import { ChatRoomsService } from './chat-rooms.service';

interface JoinRoomPayload {
  roomId: number;
  userId: number;
}

interface LeaveRoomPayload {
  roomId: number;
  userId: number;
}

interface SendMessagePayload {
  roomId: number;
  userId: number;
  content: string;
  messageType?: 'CHAT' | 'SYSTEM' | 'AI';
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatRoomsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // 사용자 소켓 매핑 (userId -> socketId)
  private userSockets: Map<number, string> = new Map();
  // 소켓별 참여 중인 방 (socketId -> { roomId, userId })
  private socketRooms: Map<string, { roomId: number; userId: number }> =
    new Map();

  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // 해당 소켓이 참여 중인 방에서 참여자 제거
    const roomInfo = this.socketRooms.get(client.id);
    if (roomInfo) {
      await this.chatRoomsService.removeParticipant(
        roomInfo.roomId,
        roomInfo.userId,
      );
      this.socketRooms.delete(client.id);
    }

    // userSockets에서 해당 소켓 제거
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.userSockets.set(data.userId, client.id);
    return { event: 'registered', data: { userId: data.userId } };
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room_${data.roomId}`;
    client.join(roomName);

    // DB에 참여자로 등록 (이미 참여중이면 무시됨)
    if (data.userId) {
      await this.chatRoomsService.addParticipant(data.roomId, data.userId);
      // 소켓-방 매핑 저장 (disconnect 시 참여자 제거용)
      this.socketRooms.set(client.id, {
        roomId: data.roomId,
        userId: data.userId,
      });
    }

    return { event: 'joinedRoom', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: LeaveRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room_${data.roomId}`;
    client.leave(roomName);

    // DB에서 참여자 제거 (비활성화)
    if (data.userId) {
      await this.chatRoomsService.removeParticipant(data.roomId, data.userId);
      this.socketRooms.delete(client.id);
    }

    return { event: 'leftRoom', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    // DB에 메시지 저장
    const message = await this.chatRoomsService.createMessage({
      roomId: data.roomId,
      userId: data.userId,
      content: data.content,
      messageType: data.messageType,
    });

    // 모든 클라이언트에게 브로드캐스트 (보낸 사람 포함)
    const roomName = `room_${data.roomId}`;
    this.server.to(roomName).emit('newMessage', message);

    // acknowledgement 응답하지 않음 - 브로드캐스트로 이미 전달됨
  }

  // 외부에서 메시지 브로드캐스트 (예: AI 응답)
  broadcastToRoom(roomId: number, event: string, data: any) {
    const roomName = `room_${roomId}`;
    this.server.to(roomName).emit(event, data);
  }
}
