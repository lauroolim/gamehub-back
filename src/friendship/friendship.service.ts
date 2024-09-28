import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { CreateFriendshipDto } from './dto/friendship.dto';

@Injectable()
export class FriendshipService {
  constructor(private prisma: PrismaService) { }

  async sendFriendRequest(senderId: number, receiverId: number) {
    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });

    if (!sender) {
      throw new NotFoundException(`Sender with ID ${senderId} not found`);
    }

    if (!receiver) {
      throw new NotFoundException(`Receiver with ID ${receiverId} not found`);
    }

    return this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
      },
    });
  }

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
  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2, status: 'accepted' },
          { senderId: userId2, receiverId: userId1, status: 'accepted' },
        ],
      },
    });

    return !!friendship;
  }
}
