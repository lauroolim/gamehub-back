import { ApiProperty } from '@nestjs/swagger';
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
  IsOptional,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiProperty()
  @IsOptional()
  bio?: string;
}
