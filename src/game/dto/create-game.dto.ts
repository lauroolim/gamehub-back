import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGameDto {
    @ApiProperty({ description: 'Nome do jogo' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Descrição do jogo' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'URL da imagem do jogo (opcional se o arquivo for fornecido)' })
    @IsOptional()
    @IsString()
    gameimageUrl?: string;
}