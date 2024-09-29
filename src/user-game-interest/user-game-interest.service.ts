import { Injectable } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';

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

    async findSimilarGames(userId: number, page: number = 1, limit: number = 15): Promise<any> {

        page = Math.max(1, Number(page) || 1);
        limit = Math.max(1, Math.min(15, Number(limit) || 15));

        const offset = (page - 1) * limit;


        const userInterests = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { GameUser: { include: { game: true } } },
        });

        if (!userInterests || userInterests.GameUser.length === 0) {
            return this.getAllUsersPaginated(page, limit);
        }

        const gameIds = userInterests.GameUser.map(gameUser => gameUser.gameId);

        const similarUsers = await this.prisma.user.findMany({
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
            skip: offset,
            take: limit,
        });

        if (similarUsers.length === 0) {
            return this.getAllUsersPaginated(page, limit);
        }

        return similarUsers;
    }


    private async getAllUsersPaginated(page: number, limit: number) {
        const offset = (page - 1) * limit;

        return this.prisma.user.findMany({
            skip: offset,
            take: limit,
            include: {
                GameUser: { include: { game: true } },
            },
        });
    }
}
