import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { CreateFriendshipDto } from './dto/friendship.dto';

@Controller('friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) { }
  @Post()
  async createFriendship(@Body() createFriendshipDto: CreateFriendshipDto) {
    const { senderId, receiverId } = createFriendshipDto;
    return this.friendshipService.sendFriendRequest(senderId, receiverId);
  }

  @Patch(':id/accept')
  async acceptFriendship(@Param('id') id: string) {
    return this.friendshipService.acceptFriendRequest(+id);
  }

  @Patch(':id/reject')
  async rejectFriendship(@Param('id') id: string) {
    return this.friendshipService.rejectFriendRequest(+id);
  }

  @Get()
  async getAllFriendships() {
    const userId = 1;
    return this.friendshipService.listFriends(userId);
  }

  @Get('are-friends/:userId1/:userId2')
  async areFriends(
    @Param('userId1') userId1: number,
    @Param('userId2') userId2: number,
  ): Promise<{ areFriends: boolean }> {
    const areFriends = await this.friendshipService.areFriends(userId1, userId2);
    return { areFriends };
  }
}