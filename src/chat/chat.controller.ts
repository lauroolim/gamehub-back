import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Prisma } from '@prisma/client';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    // Rota para criar uma nova mensagem
    @Post('send')
    async sendMessage(@Body() body: { senderId: number; receiverId: number; content: string }) {
        const message = await this.chatService.createMessage(body);
        const conversationId = await this.chatService.getConversationId(body.senderId, body.receiverId);

        // Retornando a mensagem com o conversationId como parte do mesmo objeto
        return { ...message, conversationId };
    }

    // Rota para buscar mensagens entre dois usuários
    @Get('messages/:senderId/:receiverId')
    async getMessages(@Param('senderId') senderId: number, @Param('receiverId') receiverId: number) {
        const messages = await this.chatService.getMessages(senderId, receiverId);
        const conversationId = await this.chatService.getConversationId(senderId, receiverId);

        return { conversationId, messages };
    }
}

