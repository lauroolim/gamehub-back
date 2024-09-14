import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './../shared/database/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly PrismaService: PrismaService, private jwtservice: JwtService) { }

  async login(body: LoginDto) {
    //isso aq busca o usuário com o email que vem do body da requisição
    return {
      body,
    };
    const user = await this.PrismaService.user.findUnique({
      where: {
        email: body.email,
      },
    });

    //esses ifs aq verificam se o usuário existe e se a senha está correta
    if (!user || !(await bcrypt.compare(body.password, user.password)))
      throw new BadRequestException('Invalid user');
    return {
      user,
    };
  }
}
