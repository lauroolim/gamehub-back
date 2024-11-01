import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../shared/database/prisma.module';
import { PrismaService } from '../shared/database/prisma.service';
import { FriendshipModule } from '../friendship/friendship.module';
import { S3Module } from '../shared/services/s3.module';
import { S3Service } from '../shared/services/s3.service';



@Module({
  imports: [PrismaModule, FriendshipModule, S3Module],
  controllers: [UserController],
  providers: [UserService, PrismaService, S3Service],
  exports: [UserService],
})
export class UserModule { }
