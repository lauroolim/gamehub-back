import { Injectable } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserGameInterestService {
    constructor(private readonly prisma: PrismaService) { }

    async findUserGameInterestsByUserId(userId: number): Promise<User[]> {
        return this.prisma.user.findMany({
            where: {
                games: {
                    some: {
                        id: userId,
                    },
                },
            },
            include: {
                games: true,
            },
        });
    }

    async findUserGameInterestsByGameId(gameId: number): Promise<User[]> {
        return this.prisma.user.findMany({
            where: {
                games: {
                    some: {
                        id: gameId,
                    },
                },
            },
            include: {
                games: true,
            },
        });
    }

    async findSimilarGames(userId: number): Promise<User[]> {
        // Buscar os interesses de jogos do usuário fornecido
        const userInterests = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { games: true },
        });

        if (!userInterests) {
            return [];
        }

        const gameIds = userInterests.games.map(game => game.id);

        // Buscar outros usuários que têm interesses nos mesmos jogos, excluindo o usuário fornecido
        return this.prisma.user.findMany({
            where: {
                games: {
                    some: {
                        id: { in: gameIds },
                    },
                },
                id: { not: userId },
            },
            include: {
                games: true,
            },
        });
    }
}