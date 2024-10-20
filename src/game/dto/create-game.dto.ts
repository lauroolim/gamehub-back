import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateGameDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUrl()
    gameimageUrl?: string;
}
