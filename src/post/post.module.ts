import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from '../shared/database/prisma.module';
import { PrismaService } from '../shared/database/prisma.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { FileUploadService } from '../shared/services/file-upload.service';

@Module({
  controllers: [PostController],
  imports: [PrismaModule, ThrottlerModule.forRoot([{
    ttl: 60,
    limit: 3,
  }])],
  providers: [PostService, PrismaService, FileUploadService],
})
export class PostModule { }
