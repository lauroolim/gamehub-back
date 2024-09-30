import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserGameInterestService } from './user-game-interest.service';

@Controller('user-game-interests')
export class UserGameInterestController {
  constructor(private readonly userGameInterestService: UserGameInterestService) { }

  @Get('user/:userId')
  async findUserGameInterestsByUserId(@Param('userId') userId: number) {
    return this.userGameInterestService.findUserGameInterestsByUserId(userId);
  }

  @Get('game/:gameId')
  async findUserGameInterestsByGameId(@Param('gameId') gameId: number) {
    return this.userGameInterestService.findUserGameInterestsByGameId(gameId);
  }

  @Get('similar-games/:userId')
  async getSimilarGames(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
  ) {
    return this.userGameInterestService.findSimilarGames(userId, page, limit);
  }

}