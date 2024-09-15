import { IsString, IsArray } from 'class-validator';

export class CreateUserGameInterestDto {
    @IsString()
    readonly userId: string;

    @IsArray()
    readonly games: string[];
}