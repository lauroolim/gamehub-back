import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/database/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { GameModule } from './game/game.module';


@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
  JwtModule.registerAsync({
    useFactory: async (configService: ConfigService) => ({
      global: true,
      secret: configService.getOrThrow('JWT_SECRET'),
      signOptions: { expiresIn: '1d' },
    }),
    inject: [ConfigService],
  }),
    PrismaModule, AuthModule, GameModule, GameModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
