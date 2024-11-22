import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDonationDto {
    @ApiProperty({ description: 'Valor da doação' })
    @IsNumber()
    amount: number;

    @ApiProperty({ description: 'Descrição da doação' })
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Email do usuario doador' })
    @IsEmail()
    payerEmail: string;

    @ApiProperty({ description: 'ID do jogo' })
    @IsNumber()
    gameId: number;

    @ApiProperty({ description: 'ID do usuário' })
    @IsNumber()
    userId: number;
}