import { Module } from '@nestjs/common';
import { GamesService } from './game.service';
import { GamesController } from './game.controller';
import { PrismaService } from '../shared/database/prisma.service';
import { PrismaModule } from '../shared/database/prisma.module';
import { SubscriptionService } from '../subscription/subscription.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { FileUploadService } from '../shared/services/file-upload.service';

@Module({
  imports: [PrismaModule, SubscriptionModule],
  controllers: [GamesController],
  providers: [GamesService, PrismaService, FileUploadService, SubscriptionService],
})
export class GameModule { }
