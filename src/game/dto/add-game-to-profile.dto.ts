import { IsArray, IsNumber } from 'class-validator';

export class AddGameToProfileDto {
    @IsNumber()
    userId: number;

    @IsArray()
    gameId: number[];
}