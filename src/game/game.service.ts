import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';

@Injectable()
export class GamesService implements OnModuleInit {
    private readonly games = [
        { name: 'Apex Legends', imageUrl: 'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg' },
        { name: 'World of Warcraft', imageUrl: 'https://assets2.ignimgs.com/2014/02/14/wow-boss-compilation-wallpaperjpg-dc3b63.jpg' },
        { name: 'Age of Empires', imageUrl: 'https://cdn.ageofempires.com/aoe/wp-content/uploads/2024/02/AoEM-banner-2520x1080-2.webp' },
        { name: 'League of Legends', imageUrl: 'https://s2-ge.glbimg.com/FKUe6SrgjSlshS7Jk25FNsk2AZg=/1200x/smart/filters:cover():strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2021/6/Q/Fq6AMUTJKxZA7SVgIJBA/league-of-legends.jpg' },
    ];

    constructor(private readonly prisma: PrismaService) { }

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
}
