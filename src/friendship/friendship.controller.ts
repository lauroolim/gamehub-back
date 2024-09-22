import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { CreateFriendshipDto } from './dto/friendship.dto';

@Controller('friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  // Endpoint para enviar uma solicitação de amizade
  @Post()
  async createFriendship(@Body() createFriendshipDto: CreateFriendshipDto) {
    return this.friendshipService.sendFriendRequest(createFriendshipDto);
  }

  // Endpoint para aceitar uma solicitação de amizade
  @Patch(':id/accept')
  async acceptFriendship(@Param('id') id: string) {
    return this.friendshipService.acceptFriendRequest(+id);
  }

  // Endpoint para recusar uma solicitação de amizade
  @Patch(':id/reject')
  async rejectFriendship(@Param('id') id: string) {
    return this.friendshipService.rejectFriendRequest(+id);
  }

  // Endpoint para listar todas as amizades do usuário autenticado
  @Get()
  async getAllFriendships() {
    return this.friendshipService.listFriends();
  }
}
