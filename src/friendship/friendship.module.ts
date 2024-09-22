import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { PrismaModule } from '../shared/database/prisma.module';  

@Module({
  imports: [PrismaModule],  
  controllers: [FriendshipController],
  providers: [FriendshipService],
})
export class FriendshipModule {}