import { Module } from '@nestjs/common';
import { GamesService } from './game.service';
import { GamesController } from './game.controller';
import { PrismaService } from '../shared/database/prisma.service';
import { PrismaModule } from '../shared/database/prisma.module';
import { SubscriptionService } from '../subscription/subscription.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { S3Service } from '../shared/services/s3.service';
import { S3Module } from '../shared/services/s3.module';


@Module({
  imports: [PrismaModule, SubscriptionModule, S3Module],
  controllers: [GamesController],
  providers: [GamesService, PrismaService, S3Service, SubscriptionService],
})
export class GameModule { }
