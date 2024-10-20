import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GamesService implements OnModuleInit {
    private readonly games = [
        { name: 'Apex Legends', imageUrl: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg' },
        { name: 'World of Warcraft', imageUrl: 'https://assets2.ignimgs.com/2014/02/14/wow-boss-compilation-wallpaperjpg-dc3b63.jpg' },
        { name: 'Age of Empires', imageUrl: 'https://cdn.ageofempires.com/aoe/wp-content/uploads/2024/02/AoEM-banner-2520x1080-2.webp' },
        { name: 'League of Legends', imageUrl: 'https://s2-ge.glbimg.com/FKUe6SrgjSlshS7Jk25FNsk2AZg=/1200x/smart/filters:cover():strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2021/6/Q/Fq6AMUTJKxZA7SVgIJBA/league-of-legends.jpg' },
        { name: 'Grand Theft Auto', imageUrl: 'https://s2-techtudo.glbimg.com/XiktvMqc4XkevMNvk4vkAgCNvok=/0x0:695x434/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_08fbf48bc0524877943fe86e43087e7a/internal_photos/bs/2021/A/B/7WRq3bSDevZ2py0HSE1Q/2015-01-29-gta-5.jpg' },
        { name: 'Fortnite', imageUrl: 'https://wallpapers.com/images/featured/fortnite-pictures-b5kfcchwazwiz3cs.jpg' },
        { name: 'Counter Strike 2', imageUrl: 'https://media.steampowered.com/apps/csgo/blog/images/fb_image.png?v=6' },
    ];

    constructor(private readonly prisma: PrismaService,
        private readonly subscriptionService: SubscriptionService) { }

    async onModuleInit() {
        await this.initializeGames();
    }

    private async initializeGames() {
        for (const game of this.games) {
            await this.prisma.game.upsert({
                where: { name: game.name },
                update: {
                    gameimageUrl: game.imageUrl,
                },
                create: {
                    name: game.name,
                    gameimageUrl: game.imageUrl,
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
            },
        });
    }

    async addGame(userId: number, createGameDto: CreateGameDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { Subscription: true }, // Inclui a relação com Subscription
        });

        if (!user || !user.Subscription || user.Subscription.type !== 'GameDev') {
            throw new ForbiddenException('Apenas usuários com o plano GameDev podem adicionar jogos.');
        }

        return this.prisma.game.create({
            data: {
                name: createGameDto.name,
                description: createGameDto.description,
                gameimageUrl: createGameDto.gameimageUrl,
                addedBy: {
                    connect: { id: userId },
                },
            },
        });
    }

    async getGamesByUser(userId: number) {
        return this.prisma.game.findMany({
            where: { addedBy: { id: userId } },
            select: {
                id: true,
                name: true,
                description: true,
                gameimageUrl: true,
            },
        });
    }

}
