import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';

@Injectable()
export class UserGameInterestService {
    constructor(private prisma: PrismaService) { }


    async findUserGameInterestsByUserId(userId: number) {
        try {
            const userWithGames = await this.prisma.user.findUnique({
                where: { id: userId },
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
                                }
                            }
                        }
                    },
                    gamesAdded: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true,
                            gameimageUrl: true,
                        }
                    },
                    Subscription: {
                        select: {
                            type: true,
                            isActive: true,
                        }
                    }
                }
            });

            if (!userWithGames) {
                throw new NotFoundException(`User with ID ${userId} not found`);
            }

            const games = userWithGames.Subscription?.type === 'GameDev'
                ? [...userWithGames.GameUser.map(gu => gu.game), ...userWithGames.gamesAdded]
                : userWithGames.GameUser.map(gu => gu.game);

            return {
                userId: userWithGames.id,
                username: userWithGames.username,
                profilePictureUrl: userWithGames.profilePictureUrl,
                games
            };
        } catch (error) {
            throw new Error(`Error finding user game interests: ${error.message}`);
        }
    }

    async findUserGameInterestsByGameId(gameId: number) {
        try {
            const gameWithUsers = await this.prisma.game.findUnique({
                where: { id: gameId },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                    gameimageUrl: true,
                    GameUser: {
                        select: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    profilePictureUrl: true,
                                    Subscription: {
                                        select: {
                                            type: true,
                                            isActive: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                    addedBy: {
                        select: {
                            id: true,
                            username: true,
                            profilePictureUrl: true,
                            Subscription: {
                                select: {
                                    type: true,
                                    isActive: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!gameWithUsers) {
                throw new NotFoundException(`Game with ID ${gameId} not found`);
            }

            const interestedUsers = gameWithUsers.GameUser.map(gu => gu.user);

            if (gameWithUsers.addedBy && gameWithUsers.addedBy.Subscription?.type === 'GameDev') {
                interestedUsers.push(gameWithUsers.addedBy);
            }

            return {
                gameId: gameWithUsers.id,
                gameName: gameWithUsers.name,
                gameDescription: gameWithUsers.description,
                gameCategory: gameWithUsers.category,
                gameImageUrl: gameWithUsers.gameimageUrl,
                interestedUsers
            };
        } catch (error) {
            throw new Error(`Error finding game interests: ${error.message}`);
        }
    }


    async findSimilarUsers(userId: number, page: number = 1, limit: number = 15) {
        try {
            page = Math.max(1, Number(page) || 1);
            limit = Math.max(1, Math.min(15, Number(limit) || 15));
            const offset = (page - 1) * limit;

            const currentUser = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    GameUser: {
                        include: { game: true }
                    }
                }
            });

            if (!currentUser || currentUser.GameUser.length === 0) {
                return this.getAllUsersPaginated(page, limit);
            }

            const userGameIds = currentUser.GameUser.map(gu => gu.gameId);

            const similarUsers = await this.prisma.user.findMany({
                where: {
                    AND: [
                        { id: { not: userId } },
                        {
                            GameUser: {
                                some: {
                                    gameId: { in: userGameIds }
                                }
                            }
                        }
                    ]
                },
                include: {
                    GameUser: {
                        include: { game: true }
                    },
                    Subscription: {
                        select: {
                            type: true,
                            isActive: true
                        }
                    }
                },
                skip: offset,
                take: limit
            });

            const similarUsersWithScore = similarUsers.map(user => {
                const commonGames = user.GameUser.filter(gu =>
                    userGameIds.includes(gu.gameId)
                );

                const similarityScore = (commonGames.length / userGameIds.length) * 100;

                return {
                    id: user.id,
                    username: user.username,
                    profilePictureUrl: user.profilePictureUrl,
                    bio: user.bio,
                    commonGames: commonGames.map(gu => gu.game),
                    similarityScore: Math.round(similarityScore),
                    subscription: user.Subscription
                };
            });

            const sortedUsers = similarUsersWithScore.sort(
                (a, b) => b.similarityScore - a.similarityScore
            );

            const total = await this.prisma.user.count({
                where: {
                    AND: [
                        { id: { not: userId } },
                        {
                            GameUser: {
                                some: {
                                    gameId: { in: userGameIds }
                                }
                            }
                        }
                    ]
                }
            });

            return {
                users: sortedUsers,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            throw new Error(`Error finding similar users: ${error.message}`);
        }
    }

    private async getAllUsersPaginated(page: number, limit: number) {
        const total = await this.prisma.user.count();
        const users = await this.prisma.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            include: {
                GameUser: {
                    include: { game: true }
                },
                Subscription: {
                    select: {
                        type: true,
                        isActive: true
                    }
                }
            }
        });

        return {
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                profilePictureUrl: user.profilePictureUrl,
                bio: user.bio,
                commonGames: user.GameUser.map(gu => gu.game),
                similarityScore: 0,
                subscription: user.Subscription
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

}
