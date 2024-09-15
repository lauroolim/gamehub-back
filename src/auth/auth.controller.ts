import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { FastifyReply } from 'fastify';
import { error } from 'node:console';
import { SignUpDto } from './dto/signup.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() body: LoginDto, @Res() res: FastifyReply) {
    try {
      const response = await this.authService.login(body);
      res.send({ success: true, data: response });
    } catch (err) {
      res.status(err || 500).send({ success: false, message: err.message || 'Internal server error' });
    }
  }

  @Post('signup')
  async signUp(@Body() body: SignUpDto, @Res() res: FastifyReply) {
    try {
      const response = await this.authService.SignUp(body);
      res.send({ success: true, data: response });
    } catch (err) {
      res.status(500).send({ success: false, message: err.message || 'Internal server error' });
    }
  }
}
