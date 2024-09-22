import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { CreateFriendshipDto } from './dto/friendship.dto';

@Injectable()
export class FriendshipService {
  constructor(private prisma: PrismaService) {}

  // Enviar uma solicitação de amizade
  async sendFriendRequest(senderId: number, receiverId: number) {
    return this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'pending',
      },
    });
  }

  // Aceitar uma solicitação de amizade
  async acceptFriendRequest(id: number) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } });

    if (!friendship) {
      throw new NotFoundException('Friendship request not found');
    }

    return this.prisma.friendship.update({
      where: { id },
      data: {
        status: 'accepted',
      },
    });
  }

  // Recusar uma solicitação de amizade
  async rejectFriendRequest(id: number) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } });

    if (!friendship) {
      throw new NotFoundException('Friendship request not found');
    }

    return this.prisma.friendship.update({
      where: { id },
      data: {
        status: 'rejected',
      },
    });
  }

  // Listar todos os amigos do usuário autenticado
  async listFriends(userId: number) {
    return this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }
}
