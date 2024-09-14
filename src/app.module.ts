import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/database/prisma.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }), PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
