import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDonationDto {
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    description: string;

    @IsEmail()
    payerEmail: string;
}