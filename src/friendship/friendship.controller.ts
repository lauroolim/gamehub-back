import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { CreateFriendshipDto } from './dto/friendship.dto';

@Controller('friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) { }

  @Post('follow')
  async followUser(@Body() body: { followerId: number; followingId: number }) {
    const { followerId, followingId } = body;
    return this.friendshipService.followUser(followerId, followingId);
  }

  @Post('follow/game')
  async followGame(@Body() body: { userId: number; gameId: number }) {
    const { userId, gameId } = body;
    return this.friendshipService.followGame(userId, gameId);
  }

  @Get('is-following/game/:userId/:gameId')
  async isFollowingGame(
    @Param('userId') userId: number,
    @Param('gameId') gameId: number,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.friendshipService.isFollowingGame(userId, gameId);
    return { isFollowing };
  }

  @Get('followed-games/:userId')
  async listFollowedGames(@Param('userId') userId: number) {
    return this.friendshipService.listFollowedGames(userId);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: number) {
    const following = await this.friendshipService.listFollowing(userId);
    return following.map(f => f.receiver);
  }


  @Get('followers/:userId')
  async listFollowers(@Param('userId') userId: number) {
    return this.friendshipService.listFollowers(userId);
  }

  @Get('is-following/:followerId/:followingId')
  async isFollowing(
    @Param('followerId') followerId: number,
    @Param('followingId') followingId: number,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.friendshipService.isFollowing(followerId, followingId);
    return { isFollowing };
  }

  @Get('stats/:userId')
  async getFollowStats(@Param('userId') userId: number) {
    return this.friendshipService.getFollowStats(userId);
  }

}