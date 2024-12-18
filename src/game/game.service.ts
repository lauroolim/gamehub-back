import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { S3Service } from '../shared/services/s3.service';
import { Express } from 'express';

@Injectable()
export class GamesService implements OnModuleInit {
    private readonly games = [
        { name: 'Apex Legends', imageUrl: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg', category: 'Shooter', isStatic: true },
        { name: 'World of Warcraft', imageUrl: 'https://assets2.ignimgs.com/2014/02/14/wow-boss-compilation-wallpaperjpg-dc3b63.jpg', category: 'MMORPG', isStatic: true },
        { name: 'Age of Empires', imageUrl: 'https://cdn.ageofempires.com/aoe/wp-content/uploads/2024/02/AoEM-banner-2520x1080-2.webp', category: 'Strategy', isStatic: true },
        { name: 'League of Legends', imageUrl: 'https://s2-ge.glbimg.com/FKUe6SrgjSlshS7Jk25FNsk2AZg=/1200x/smart/filters:cover():strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2021/6/Q/Fq6AMUTJKxZA7SVgIJBA/league-of-legends.jpg', category: 'MOBA', isStatic: true },
        { name: 'Grand Theft Auto', imageUrl: 'https://s2-techtudo.glbimg.com/XiktvMqc4XkevMNvk4vkAgCNvok=/0x0:695x434/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_08fbf48bc0524877943fe86e43087e7a/internal_photos/bs/2021/A/B/7WRq3bSDevZ2py0HSE1Q/2015-01-29-gta-5.jpg', category: 'Action', isStatic: true },
        { name: 'Fortnite', imageUrl: 'https://wallpapers.com/images/featured/fortnite-pictures-b5kfcchwazwiz3cs.jpg', category: 'Battle Royale', isStatic: true },
        { name: 'Counter Strike 2', imageUrl: 'https://media.steampowered.com/apps/csgo/blog/images/fb_image.png?v=6', category: 'Shooter', isStatic: true },
    ];

    constructor(
        private readonly prisma: PrismaService,
        private readonly s3Service: S3Service,
    ) { }

    async onModuleInit() {
        await this.initializeGames();
    }

    private async initializeGames() {
        for (const game of this.games) {
            await this.prisma.game.upsert({
                where: { name: game.name },
                update: {
                    gameimageUrl: game.imageUrl,
                    category: game.category,
                    isStatic: game.isStatic,
                },
                create: {
                    name: game.name,
                    gameimageUrl: game.imageUrl,
                    category: game.category,
                    isStatic: game.isStatic,
                },
            });
        }
    }

    async findAll() {
        return this.prisma.game.findMany({
            select: {
                id: true,
                name: true,
                gameimageUrl: true,
                category: true,
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.game.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                gameimageUrl: true,
                category: true,
            },
        });
    }

    async addGame(userId: number, createGameDto: CreateGameDto, file?: Express.Multer.File) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { Subscription: true, gamesAdded: true },
        });

        if (!user || !user.Subscription) {
            throw new ForbiddenException('Apenas usuários assinantes podem adicionar jogos.');
        }

        const maxGames = user.Subscription.type === 'GameDev' ? 10 : 2;

        if (user.gamesAdded.length >= maxGames) {
            throw new ForbiddenException(
                `Limite de jogos adicionados atingido: ${maxGames} jogos permitidos para seu plano.`,
            );
        }

        let imageUrl: string | null = null;

        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`;
            imageUrl = await this.s3Service.uploadFile(fileName, file.buffer);
        } else if (createGameDto.gameimageUrl) {
            imageUrl = createGameDto.gameimageUrl;
        }

        const game = await this.prisma.game.create({
            data: {
                name: createGameDto.name,
                description: createGameDto.description,
                gameimageUrl: imageUrl,
                category: createGameDto.category,
                addedBy: {
                    connect: { id: userId },
                },
                GameUser: {
                    create: {
                        userId: userId,
                    },
                },
            },
        });

        return game;
    }

    async getGamesByUser(userId: number) {
        return this.prisma.game.findMany({
            where: { addedBy: { id: userId } },
            select: {
                id: true,
                name: true,
                description: true,
                gameimageUrl: true,
                category: true,
            },
        });
    }

    async getGamesByCategory(category: string) {
        return this.prisma.game.findMany({
            where: { category },
            select: {
                id: true,
                name: true,
                gameimageUrl: true,
            },
        });
    }


    async getGameProfile(gameId: number): Promise<any> {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            select: {
                id: true,
                name: true,
                description: true,
                gameimageUrl: true,
                category: true,
                isStatic: true,
                addedBy: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        const followersCount = await this.prisma.gameFollower.count({
            where: { gameId },
        });

        const postsCount = await this.prisma.post.count({
            where: { gameId },
        });

        const recentPosts = await this.prisma.post.findMany({
            where: { gameId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                content: true,
                imageUrl: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });

        return {
            ...game,
            followersCount,
            postsCount,
            recentPosts,
        };
    }

    async updateGame(id: number, updateGameDto: UpdateGameDto, file?: Express.Multer.File) {
        let imageUrl: string | null = null;

        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`;
            imageUrl = await this.s3Service.uploadFile(fileName, file.buffer);
        } else if (updateGameDto.gameimageUrl) {
            imageUrl = updateGameDto.gameimageUrl;
        }

        const dataToUpdate: Partial<UpdateGameDto> = {
            ...updateGameDto,
            ...(imageUrl && { gameimageUrl: imageUrl }),
        };

        return this.prisma.game.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    async addGamesToProfile(userId: number, gameIds: number[]) {
        const games = await this.prisma.game.findMany({
            where: { id: { in: gameIds } },
        });

        if (games.length !== gameIds.length) {
            throw new NotFoundException('One or more games not found');
        }

        const existingRelations = await this.prisma.gameUser.findMany({
            where: {
                userId,
                gameId: { in: gameIds },
            },
            select: { gameId: true },
        });

        const existingGameIds = existingRelations.map((rel) => rel.gameId);

        const newGameIds = gameIds.filter((id) => !existingGameIds.includes(id));

        if (newGameIds.length === 0) {
            throw new ConflictException('All games are already added to profile');
        }

        const data = newGameIds.map((gameId) => ({ userId, gameId }));

        await this.prisma.gameUser.createMany({
            data,
        });

        return { message: 'Games added to profile successfully' };
    }

    async getGamesNotInUserProfile(userId: number) {
        const userGames = await this.prisma.gameUser.findMany({
            where: { userId },
            select: { gameId: true },
        });
        const gameIds = userGames.map((gameUser) => gameUser.gameId);

        return this.prisma.game.findMany({
            where: {
                id: {
                    notIn: gameIds.length > 0 ? gameIds : [0],
                },
            },
        });
    }
}
