import { Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../shared/services/s3.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
  ) { }

  private extractFileKeyFromUrl(url: string): string | null {
    const matches = url.match(/amazonaws\.com\/(.*)/);
    return matches ? matches[1] : null;
  }

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

  async findByUsername(username: string, requestedPage: number, limit: number) {
    const total = await this.prismaService.user.count({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const validatedPage = Math.min(totalPages, Math.max(1, requestedPage));

    const offset = (validatedPage - 1) * limit;

    const users = await this.prismaService.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
      skip: offset,
      take: limit,
      select: {
        id: true,
        username: true,
        profilePictureUrl: true,
      },
    });

    return {
      users,
      total,
      page: validatedPage,
      totalPages,
      limit,
      hasNextPage: validatedPage < totalPages,
      hasPreviousPage: validatedPage > 1,
      message: requestedPage > totalPages ?
        `Requested page ${requestedPage} exceeds total pages. Showing page ${validatedPage}` :
        undefined
    };
  }
  async findByGameName(gameName: string, requestedPage: number, limit: number) {
    const total = await this.prismaService.user.count({
      where: {
        GameUser: {
          some: {
            game: {
              name: {
                contains: gameName,
                mode: 'insensitive',
              },
            },
          },
        },
      },
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const validatedPage = Math.min(totalPages, Math.max(1, requestedPage));
    const offset = (validatedPage - 1) * limit;

    const users = await this.prismaService.user.findMany({
      where: {
        GameUser: {
          some: {
            game: {
              name: {
                contains: gameName,
                mode: 'insensitive',
              },
            },
          },
        },
      },
      skip: offset,
      take: limit,
      select: {
        id: true,
        username: true,
        profilePictureUrl: true,
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
      },
    });

    return {
      users,
      total,
      page: validatedPage,
      totalPages,
      limit,
      hasNextPage: validatedPage < totalPages,
      hasPreviousPage: validatedPage > 1,
      message: requestedPage > totalPages
        ? `Requested page ${requestedPage} exceeds total pages. Showing page ${validatedPage}`
        : undefined,
    };
  }

  async addMercadoPagoAccountId(userId: number, mercadoPagoId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { Subscription: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.Subscription || !user.Subscription.isActive) {
      throw new ConflictException('Subscription is not active');
    }

    return await this.prismaService.user.update({
      where: { id: userId },
      data: {
        mercadoPagoAccountId: Number(mercadoPagoId),
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id },
        data: {
          username: updateUserDto.username,
          bio: updateUserDto.bio,
          profilePictureUrl: updateUserDto.profilePictureUrl,
        },
        select: {
          id: true,
          username: true,
          bio: true,
          profilePictureUrl: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Username already exists');
      }
      throw new InternalServerErrorException(`Error updating user: ${error.message}`);
    }
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
    try {
      const currentUser = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { profilePictureUrl: true }
      });

      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      let newProfilePictureUrl = updateUserDto.profilePictureUrl;

      if (file) {
        if (currentUser.profilePictureUrl) {
          const existingFileKey = this.extractFileKeyFromUrl(currentUser.profilePictureUrl);
          if (existingFileKey) {
            await this.s3Service.deleteFile(existingFileKey);
          }
        }

        const fileName = `profile-${userId}-${Date.now()}-${file.originalname}`;
        newProfilePictureUrl = await this.s3Service.uploadFile(fileName, file.buffer);
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          ...updateUserDto,
          profilePictureUrl: newProfilePictureUrl,
        },
        select: {
          id: true,
          username: true,
          bio: true,
          profilePictureUrl: true,
        },
      });

      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException(`Error updating profile: ${error.message}`);
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
}
