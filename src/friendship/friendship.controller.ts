import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { CreateFriendshipDto } from './dto/friendship.dto';

@Controller('friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) { }

  // Rota para seguir um usuário
  @Post('follow')
  async followUser(@Body() body: { followerId: number; followingId: number }) {
    const { followerId, followingId } = body;
    return this.friendshipService.followUser(followerId, followingId);
  }


  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: number) {
    const following = await this.friendshipService.listFollowing(userId);
    return following.map(f => f.receiver);
  }


  // Listar os seguidores de um usuário
  @Get('followers/:userId')
  async listFollowers(@Param('userId') userId: number) {
    return this.friendshipService.listFollowers(userId);
  }

  // Verificar se um usuário está seguindo outro
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