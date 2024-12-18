import { Body, Controller, ForbiddenException, Get, Param, Post, UploadedFile, UseInterceptors, Req, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GamesService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Request } from 'express';
import { AddGameToProfileDto } from './dto/add-game-to-profile.dto';

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

  @Post('profile/add')
  async addGameToProfile(
    @Body() addGameToProfileDto: AddGameToProfileDto,
  ) {
    return this.gamesService.addGamesToProfile(addGameToProfileDto.userId,
      addGameToProfileDto.gameId
    );
  }

  @Get('not-in-profile/:userId')
  async getGamesNotInUserProfile(@Param('userId') userId: string) {
    return this.gamesService.getGamesNotInUserProfile(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.gamesService.findOne(id);
  }

  @Get(':gameId/profile')
  async getGameProfile(@Param('gameId') gameId: string) {
    return this.gamesService.getGameProfile(Number(gameId));
  }
}

