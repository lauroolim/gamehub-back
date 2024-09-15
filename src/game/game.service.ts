import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';

@Injectable()
export class GamesService implements OnModuleInit {
    private readonly games = ['Apex Legends', 'World of Warcraft', 'Age of Empires', 'League of Legends'];

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.initializeGames();
    }

    private async initializeGames() {
        for (const gameName of this.games) {
            await this.prisma.game.upsert({
                where: { name: gameName },
                update: {},
                create: { name: gameName },
            });
        }
    }

    async findAll() {
        return this.prisma.game.findMany();
    }
}