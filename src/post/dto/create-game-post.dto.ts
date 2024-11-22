import { ApiProperty } from '@nestjs/swagger';

export class CreateGamePostDto {
    @ApiProperty({ description: 'Conteúdo do post' })
    content: string;

    @ApiProperty({ description: 'Id do jogo' })
    gameId: number;

    @ApiProperty({ description: 'id do autor' })
    authorId: number;
}
