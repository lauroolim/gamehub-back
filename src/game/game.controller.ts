import { Body, Controller, ForbiddenException, Get, Param, Post, UploadedFile, UseInterceptors, Req, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GamesService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Request } from 'express';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  @Post('add/:userId')
  @UseInterceptors(FileInterceptor('file'))
  async addGame(
    @Param('userId') userId: number,
    @Body() createGameDto: CreateGameDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.gamesService.addGame(userId, createGameDto, file);
  }

  @Put('update/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateGame(
    @Param('id') id: number,
    @Body() updateGameDto: UpdateGameDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.gamesService.updateGame(id, updateGameDto, file);
  }

  @Get('user/:userId')
  async getGamesByUser(@Param('userId') userId: number) {
    return this.gamesService.getGamesByUser(userId);
  }
}