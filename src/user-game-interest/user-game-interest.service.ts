import { Injectable } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserGameInterestService {
    constructor(private prisma: PrismaService) { }

    async findUserGameInterestsByUserId(userId: number) {
        return this.prisma.gameUser.findMany({
            where: { userId },
            include: { game: true },
        });
    }

    async findUserGameInterestsByGameId(gameId: number) {
        return this.prisma.gameUser.findMany({
            where: { gameId },
            include: { user: true },
        });
    }

    async findSimilarGames(userId: number): Promise<User[]> {
        // Buscar os interesses de jogos do usuário fornecido
        const userInterests = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { GameUser: { include: { game: true } } },
        });

        if (!userInterests) {
            return [];
        }

        const gameIds = userInterests.GameUser.map(gameUser => gameUser.gameId);

        // Buscar outros usuários que têm interesses nos mesmos jogos, excluindo o usuário fornecido
        return this.prisma.user.findMany({
            where: {
                GameUser: {
                    some: {
                        gameId: { in: gameIds },
                    },
                },
                id: { not: userId },
            },
            include: {
                GameUser: { include: { game: true } },
            },
        });
    }
}