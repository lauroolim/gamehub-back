import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt/ws-jwt.guard';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'https://gamehub-back-6h0k.onrender.com',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }


  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const { senderId, receiverId, content } = payload.data;

    if (!senderId || !receiverId || !content) {
      this.logger.error('Missing required fields: senderId, receiverId, or content');
      throw new Error('Missing required fields: senderId, receiverId, or content');
    }

    const user = (client as any).user;
    this.logger.log(`Usuário autenticado: ${user.username}`);

    try {
      const message = await this.chatService.createMessage({ senderId, receiverId, content });
      const conversationId = await this.chatService.getConversationId(senderId, receiverId);

      this.server.emit('message', { ...message, conversationId });
    } catch (error) {
      this.logger.error('Erro ao criar mensagem:', error.message);
      throw new Error('Erro ao criar mensagem');
    }
  }

}
