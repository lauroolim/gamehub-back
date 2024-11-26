import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGameDto {
  @ApiPropertyOptional({ description: 'Nome do jogo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do jogo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'URL da imagem do jogo' })
  @IsOptional()
  @IsString()
  gameimageUrl?: string;

  @ApiPropertyOptional({ description: 'Categoria do jogo' })
  @IsOptional()
  @IsString()
  category?: string;
}
