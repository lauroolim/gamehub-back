import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) { }

  async findAll() {
    return this.prismaService.user.findMany({
      select: {
        id: true,
        username: true,
        bio: true,
        profilePictureUrl: true,
        followers: true,
        following: true,
        gamesAdded: true,
        GameUser: {
          select: {
            game: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                gameimageUrl: true,
              },
            },
          },
        },
        Subscription: {
          select: {
            type: true,
            isActive: true,
            expiresAt: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        bio: true,
        profilePictureUrl: true,
        followers: true,
        following: true,
        Subscription: {
          select: {
            type: true,
            isActive: true,
            expiresAt: true,
          },
        },
        GameUser: {
          select: {
            game: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                gameimageUrl: true,
              },
            },
          },
        },
        receivedFriendships: {
          where: { status: 'accepted' },
          select: {
            sender: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        sentFriendships: {
          where: { status: 'accepted' },
          select: {
            receiver: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { gameIds, username, bio, profilePictureUrl } = updateUserDto;

    const updateData: any = {};

    if (username) updateData.username = username;
    if (profilePictureUrl) updateData.profilePictureUrl = profilePictureUrl;
    if (bio !== undefined) updateData.bio = bio;

    if (gameIds) {
      updateData.GameUser = {
        connect: gameIds.map((gameId) => ({ gameId })),
      };
    }

    try {
      return await this.prismaService.user.update({
        where: { id },
        data: updateData,
        include: {
          gamesAdded: true,
          Subscription: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number) {
    try {
      return await this.prismaService.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error deleting user');
    }
  }

  async getUserProfile(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        gamesAdded: true,
        Subscription: true,
        receivedFriendships: {
          select: {
            sender: {
              select: { id: true, username: true, profilePictureUrl: true },
            },
          },
        },
        sentFriendships: {
          select: {
            receiver: {
              select: { id: true, username: true, profilePictureUrl: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl,
      followers: user.followers,
      following: user.following,
      gamesAdded: user.gamesAdded,
      subscriptionType: user.Subscription?.type,
      subscriptionExpiresAt: user.Subscription?.expiresAt,
      isGameDev: user.Subscription?.type === 'GameDev',
      receivedFriendships: user.receivedFriendships,
      sentFriendships: user.sentFriendships,
    };
  }
}
