import {
    validate,
    validateOrReject,
    Contains,
    IsInt,
    Length,
    IsEmail,
    IsFQDN,
    IsDate,
    Min,
    Max,
    IsString,
    IsNotEmpty
} from 'class-validator';

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(8, 30)
    password: string;
}