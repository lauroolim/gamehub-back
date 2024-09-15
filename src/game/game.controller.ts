import { Controller, Get } from '@nestjs/common';
import { GamesService } from './game.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Get()
  findAll() {
    return this.gamesService.findAll();
  }
}
