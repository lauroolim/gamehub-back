import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBenefitDto {
    @ApiProperty({ description: 'ID do jogo' })
    @IsNumber()
    gameId: number;

    @ApiProperty({ description: 'Meta de benefícios' })
    @IsNumber()
    threshold: number;

    @ApiProperty({ description: 'Descrição do benefício' })
    @IsString()
    @IsNotEmpty()
    description: string;
}
