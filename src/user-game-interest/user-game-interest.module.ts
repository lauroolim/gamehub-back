import { Module } from '@nestjs/common';
import { UserGameInterestService } from './user-game-interest.service';
import { UserGameInterestController } from './user-game-interest.controller';
import { PrismaModule } from '../shared/database/prisma.module';
import { PrismaService } from 'src/shared/database/prisma.service';

@Module({
  imports: [PrismaModule],
  providers: [UserGameInterestService, PrismaService],
  controllers: [UserGameInterestController],
})
export class UserGameInterestModule { }