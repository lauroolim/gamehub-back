import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) { }

    async findAll() {
        return this.prismaService.user.findMany({
            include: {
                GameUser: {
                    include: {
                        game: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        return this.prismaService.user.findUnique({
            where: {
                id: id,
            },
            include: {
                GameUser: {
                    include: {
                        game: true,
                    },
                },
            },
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const { gameIds, username } = updateUserDto;

        const updateData: any = {};

        if (username) {
            updateData.username = username; // Corrigido para usar 'username'
        }

        if (gameIds) {
            updateData.games = {
                connect: gameIds.map(gameId => ({ id: gameId })),
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