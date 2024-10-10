import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FriendshipService } from '../friendship/friendship.service';

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
                GameUser: {
                    include: {
                        game: true,
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
                GameUser: {
                    include: {
                        game: true,
                    },
                },
            },
        });

        if (!user) {
            throw new InternalServerErrorException('User not found');
        }

        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const { gameIds, username, bio } = updateUserDto;

        const updateData: any = {};

        if (username) {
            updateData.username = username;
        }

        if (bio !== undefined) {
            updateData.bio = bio;
        } else {
            updateData.bio = '';
        }

        if (gameIds) {
            updateData.games = {
                connect: gameIds.map((gameId) => ({ id: gameId })),
            };
        }

        try {
            return await this.prismaService.user.update({
                where: {
                    id: id,
                },
                data: updateData,
            });
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async remove(id: number) {
        return this.prismaService.user.delete({
            where: {
                id: id,
            },
        });
    }
}