import { Controller, Get, Param } from '@nestjs/common';
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

  @Get(':userId/find-similar-games')
  async findSimilarGames(@Param('userId') userId: number) {
    return this.userGameInterestService.findSimilarGames(userId);
  }
}