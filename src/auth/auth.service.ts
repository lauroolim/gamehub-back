import { ConfigService } from '@nestjs/config';
import { UtilsService } from './../shared/services/utils.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './../shared/database/prisma.service';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { ResponseLoginDto } from './dto/response-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly PrismaService: PrismaService,
    private jwtservice: JwtService,
    private utilsService: UtilsService,
    private readonly configService: ConfigService
  ) { }

  async login(body: LoginDto) {
    const user = await this.PrismaService.user.findUnique({
      where: {
        email: body.email,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePictureUrl: true,
        createdAt: true,
        password: true,
        Subscription: {
          select: {
            isActive: true
          }
        }
      },
    });

    if (!user || !(await bcrypt.compare(body.password, user.password)))
      throw new BadRequestException('Invalid user');
    delete user.password;

    return {
      user: new ResponseLoginDto(user),
      token: await this.jwtservice.signAsync({ id: user.id }, {
        secret: this.configService.get('JWT_SECRET'),
      }),
    };
  }

  async signUp(signUpDto: SignUpDto) {
    const searchUserByEmail = await this.PrismaService.user.findFirst({
      where: {
        email: signUpDto.email,
      },
    });

    if (searchUserByEmail) throw new BadRequestException('Email already registered');

    const searchUserByUsername = await this.PrismaService.user.findFirst({
      where: {
        username: signUpDto.username,
      },
    });

    if (searchUserByUsername) throw new BadRequestException('Username already taken');

    const gameIds = signUpDto.games || [];
    const existingGames = await this.PrismaService.game.findMany({
      where: {
        id: { in: gameIds },
      },
    });

    if (existingGames.length !== gameIds.length) {
      throw new BadRequestException('One or more game IDs are invalid');
    }

    const newUser = await this.PrismaService.user.create({
      data: {
        username: signUpDto.username,
        email: signUpDto.email,
        password: await bcrypt.hash(signUpDto.password, 10),
        profilePictureUrl: signUpDto.profilePicture,
        createdAt: new Date(),
      },
    });

    if (!newUser) throw new InternalServerErrorException('Error creating user');

    await this.PrismaService.gameUser.createMany({
      data: gameIds.map(gameId => ({
        gameId,
        userId: newUser.id,
      })),
    });

    return newUser;
  }
}