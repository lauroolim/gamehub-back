import { Body, Controller, ForbiddenException, Get, Param, Post, UploadedFile, UseInterceptors, Req, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GamesService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { Request } from 'express';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

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

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateGames(
    @Param('id') id: number,
    @Body() createGameDto: CreateGameDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.gamesService.updateGames(id, createGameDto, file);
  }

  @Get('user/:userId')
  async getGamesByUser(@Param('userId') userId: number) {
    return this.gamesService.getGamesByUser(userId);
  }


  @Get('not-in-profile/:userId')
  async getGamesNotInUserProfile(@Param('userId') userId: string) {
    return this.gamesService.getGamesNotInUserProfile(+userId);
  }
}

