import { Module } from '@nestjs/common';
import { GamesService } from './game.service';
import { GamesController } from './game.controller';
import { PrismaService } from 'src/shared/database/prisma.service';
import { PrismaModule } from 'src/shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GamesController],
  providers: [GamesService, PrismaService],
})
export class GameModule { }
