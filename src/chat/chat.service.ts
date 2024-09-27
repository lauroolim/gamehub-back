import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // Função para gerar ou buscar um ID de conversa entre dois usuários
    async getConversationId(senderId: number, receiverId: number): Promise<number> {
        if (!senderId || !receiverId) {
            throw new Error('Invalid senderId or receiverId');
        }

        return senderId < receiverId
            ? senderId * 100000 + receiverId
            : receiverId * 100000 + senderId;
    }

    // Função para criar uma nova mensagem com conversationId
    async createMessage(data: { senderId: number; receiverId: number; content: string }) {
        // Verifique se os usuários existem
        const senderExists = await this.prisma.user.findUnique({
            where: { id: data.senderId },
        });

        const receiverExists = await this.prisma.user.findUnique({
            where: { id: data.receiverId },
        });

        if (!senderExists || !receiverExists) {
            throw new Error('Sender or receiver does not exist');
        }

        const conversationId = await this.getConversationId(data.senderId, data.receiverId);

        // Criar a mensagem
        return this.prisma.message.create({
            data: {
                content: data.content,
                conversationId: conversationId,
                messageSender: { connect: { id: data.senderId } },
                messageReceiver: { connect: { id: data.receiverId } },
            },
        });
    }


    // Função para buscar mensagens entre dois usuários
    async getMessages(senderId: number, receiverId: number) {
        const conversationId = await this.getConversationId(senderId, receiverId);
        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        });
    }
}

