import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../shared/database/prisma.service';
import { ChatController } from './chat.controller';
import { FriendshipModule } from '../friendship/friendship.module';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET }), FriendshipModule],
  providers: [ChatGateway, ChatService, UserService, JwtAuthGuard, PrismaService],
  controllers: [ChatController],
})
export class ChatModule { }
