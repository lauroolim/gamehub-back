import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFriendshipDto {
  @IsNotEmpty()
  @IsNumber()
  senderId: number;

  @IsNotEmpty()
  @IsNumber()
  receiverId: number;
}