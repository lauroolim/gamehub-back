import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/shared/database/prisma.module';
import { PrismaService } from 'src/shared/database/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule { }
