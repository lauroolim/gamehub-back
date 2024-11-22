import { ApiProperty } from '@nestjs/swagger';

export class CreateUserPostDto {
    @ApiProperty({ description: 'Conteúdo do post' })
    content: string;

    @ApiProperty({ description: 'ID do autor' })
    authorId: number;

    @ApiProperty({ description: 'ID do jogo', required: false })
    gameId?: number;
}