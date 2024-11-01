import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserGameInterestService } from './user-game-interest.service';

@Controller('user-game-interests')
export class UserGameInterestController {
  constructor(private readonly userGameInterestService: UserGameInterestService) { }

  @Get('user/:userId')
  findUserGameInterests(@Param('userId') userId: string) {
    return this.userGameInterestService.findUserGameInterestsByUserId(+userId);
  }

  @Get('game/:gameId')
  findGameUserInterests(@Param('gameId') gameId: string) {
    return this.userGameInterestService.findUserGameInterestsByGameId(+gameId);
  }

  @Get('similar-games/:userId')
  async getSimilarGames(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 15,
  ) {
    return this.userGameInterestService.findSimilarUsers(userId, page, limit);
  }

}