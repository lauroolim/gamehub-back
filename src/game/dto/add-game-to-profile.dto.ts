import { IsNumber } from 'class-validator';

export class AddGameToProfileDto {
    @IsNumber()
    userId: number;

    @IsNumber()
    gameId: number;
}