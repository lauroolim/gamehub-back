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
    IsNotEmpty,
    IsOptional,
    IsArray
} from 'class-validator';

export class SignUpDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(8, 30)
    password: string;

    @IsString()
    profilePicture?: string;

    createdAt?: Date;

    @IsOptional()
    game?: string[];
}