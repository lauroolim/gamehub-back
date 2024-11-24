import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { CreateFriendshipDto } from './dto/friendship.dto';

@Injectable()
export class FriendshipService {
  constructor(private prisma: PrismaService) { }

  async followUser(followerId: number, followingId: number) {
    const follower = await this.prisma.user.findUnique({ where: { id: followerId } });
    const following = await this.prisma.user.findUnique({ where: { id: followingId } });

    if (!follower) {
      throw new NotFoundException(`User with ID ${followerId} not found`);
    }

    if (!following) {
      throw new NotFoundException(`User with ID ${followingId} not found`);
    }

    const friendship = await this.prisma.friendship.create({
      data: {
        senderId: followerId,
        receiverId: followingId,
        status: 'following',
      },
    });

    await this.prisma.user.update({
      where: { id: followerId },
      data: { following: { increment: 1 } },
    });

    await this.prisma.user.update({
      where: { id: followingId },
      data: { followers: { increment: 1 } },
    });

    return friendship;
  }

  async followGame(userId: number, gameId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    const existingFollow = await this.prisma.gameFollower.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('User is already following this game');
    }

    const gameFollower = await this.prisma.gameFollower.create({
      data: {
        userId,
        gameId,
      },
    });

    return gameFollower;
  }

  async isFollowingGame(userId: number, gameId: number): Promise<boolean> {
    const count = await this.prisma.gameFollower.count({
      where: {
        userId,
        gameId,
      },
    });
    return count > 0;
  }

  async listFollowedGames(userId: number) {
    return this.prisma.gameFollower.findMany({
      where: { userId },
      include: {
        game: true,
      },
    });
  }

  async listFollowing(userId: number) {
    return this.prisma.friendship.findMany({
      where: { senderId: userId, status: 'following' },
      select: {
        receiver: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });
  }


  async listFollowers(userId: number) {
    return this.prisma.friendship.findMany({
      where: { receiverId: userId, status: 'following' },
      include: { sender: true },
    });
  }


  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const following = await this.prisma.friendship.findFirst({
      where: {
        senderId: followerId,
        receiverId: followingId,
        status: 'following',
      },
    });

    return !!following;
  }
  async getFollowStats(userId: number) {
    const followersCount = await this.prisma.friendship.count({
      where: {
        receiverId: userId,
        status: 'following',
      },
    });

    const followingCount = await this.prisma.friendship.count({
      where: {
        senderId: userId,
        status: 'following',
      },
    });

    return { followersCount, followingCount };
  }
}