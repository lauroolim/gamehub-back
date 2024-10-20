import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GamesService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  @Post('add/:userId')
  async addGame(
    @Param('userId') userId: number,
    @Body() createGameDto: CreateGameDto,
  ) {
    return this.gamesService.addGame(userId, createGameDto);
  }

  @Get('user/:userId')
  async getGamesByUser(@Param('userId') userId: number) {
    return this.gamesService.getGamesByUser(userId);
  }
}
