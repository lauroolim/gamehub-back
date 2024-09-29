import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { PrismaModule } from '../shared/database/prisma.module';
import { PrismaService } from '../shared/database/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [FriendshipController],
  providers: [FriendshipService, PrismaService],
  exports: [FriendshipService]
})
export class FriendshipModule { }