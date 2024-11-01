import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getConversationId(senderId: number, receiverId: number): Promise<number> {
        if (!senderId || !receiverId) {
            throw new Error('Invalid senderId or receiverId');
        }

        return senderId < receiverId
            ? senderId * 100000 + receiverId
            : receiverId * 100000 + senderId;
    }

    async createMessage(data: { senderId: number; receiverId: number; content: string }) {
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

        return this.prisma.message.create({
            data: {
                content: data.content,
                conversationId: conversationId,
                messageSender: { connect: { id: data.senderId } },
                messageReceiver: { connect: { id: data.receiverId } },
            },
        });
    }


    async getMessages(senderId: number, receiverId: number) {
        const conversationId = await this.getConversationId(senderId, receiverId);
        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async listConversations(userId: number) {
        const conversations = await this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
            select: {
                conversationId: true,
            },
            distinct: ['conversationId'],
        });

        const conversationsWithLastMessage = await Promise.all(
            conversations.map(async (conversation) => {
                const lastMessage = await this.prisma.message.findFirst({
                    where: {
                        conversationId: conversation.conversationId,
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        messageSender: {
                            select: {
                                id: true,
                                username: true,
                                profilePictureUrl: true,
                            },
                        },
                        messageReceiver: {
                            select: {
                                id: true,
                                username: true,
                                profilePictureUrl: true,
                            },
                        },
                    },
                });

                return lastMessage;
            })
        );

        return conversationsWithLastMessage;
    }
}
