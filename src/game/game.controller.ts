import { Body, Controller, ForbiddenException, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GamesService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  @Post(':userId/add')
  @UseInterceptors(FileInterceptor('file'))
  async addGame(
    @Param('userId') userId: number,
    @Body() createGameDto: CreateGameDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      return await this.gamesService.addGame(userId, createGameDto, file);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Erro ao adicionar o jogo.');
    }
  }

  @Get('user/:userId')
  async getGamesByUser(@Param('userId') userId: number) {
    return this.gamesService.getGamesByUser(userId);
  }
}
