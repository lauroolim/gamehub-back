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

    @ApiProperty({ description: 'URL da imagem do jogo (opcional se o arquivo for fornecido)' })
    @IsNotEmpty()
    @IsString()
    gameimageUrl: string;

    @ApiProperty({ description: 'Categoria do jogo' })
    @IsNotEmpty()
    @IsString()
    category: string;
}