import { IsInt, IsString, Length } from 'class-validator';

export class SendMessageDto {
    @IsInt()
    senderId: number;

    @IsInt()
    receiverId: number;

    @IsString()
    @Length(1, 500)
    content: string;
}
