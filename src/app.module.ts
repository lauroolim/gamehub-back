import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/database/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { GameModule } from './game/game.module';
import { UserGameInterestModule } from './user-game-interest/user-game-interest.module';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { ChatModule } from './chat/chat.module';
import { AppService } from './app.service';
import { WsJwtGuard } from './auth/ws-jwt/ws-jwt.guard';
import { FriendshipModule } from './friendship/friendship.module';
import { PostModule } from './post/post.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TesteModule } from './teste/teste.module';


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
    PrismaModule,
    AuthModule,
    GameModule,
    UserGameInterestModule,
    UserModule,
    ChatModule,
    FriendshipModule,
    PostModule,
    SubscriptionModule,
    TesteModule
  ],
  controllers: [],
  providers: [
    AppService, {
      provide: 'APP_GUARD',
      useClass: WsJwtGuard,
    }
  ],
})
export class AppModule { }
