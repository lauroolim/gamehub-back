import { CreateGamePostDto } from './dto/create-game-post.dto';
import { Injectable, ConflictException, NotFoundException, InternalServerErrorException, HttpCode } from '@nestjs/common';
import { CreateUserPostDto } from './dto/create-user-post.dto';
import { PrismaService } from '../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
  });

  async uploadFile(fileName: string, file: Buffer): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: 'midias-app-gamehub',
      Key: fileName,
      Body: file,
      ACL: 'public-read',
    });
    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new InternalServerErrorException('Error uploading file to S3');
    }
    return `https://midias-app-gamehub.s3.amazonaws.com/${fileName}`;
  }

  @HttpCode(200)
  async createUserPost(createPostDto: CreateUserPostDto, file?: Express.Multer.File) {
    let imageUrl: string | null = null;

    if (file) {
      const fileName = `${Date.now()}-${file.originalname}`;
      imageUrl = await this.uploadFile(fileName, file.buffer);
    }

    const user = await this.prisma.user.findUnique({ where: { id: createPostDto.authorId } });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (createPostDto.gameId) {
      const game = await this.prisma.game.findUnique({
        where: { id: createPostDto.gameId },
      });
      if (!game) {
        throw new NotFoundException('Game not found');
      }
    }

    await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        author: { connect: { id: createPostDto.authorId } },
        imageUrl,
        game: createPostDto.gameId ? { connect: { id: createPostDto.gameId } } : undefined,
      },
    });
  }

  @HttpCode(200)
  async createGamePost(createGamePostDto: CreateGamePostDto, file?: Express.Multer.File) {
    let imageUrl: string | null = null;

    const { gameId, authorId } = createGamePostDto;

    if (file) {
      const fileName = `${Date.now()}-${file.originalname}`;
      imageUrl = await this.uploadFile(fileName, file.buffer);
    }

    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('game not found');
    }

    await this.prisma.post.create({
      data: {
        content: createGamePostDto.content,
        imageUrl,
        author: { connect: { id: authorId } },
        game: { connect: { id: gameId } },
      },
    });
  }

  async findAll() {
    return this.prisma.post.findMany();
  }

  async findOne(id: number) {
    return this.prisma.post.findUnique({ where: { id } });
  }

  async remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }

  async isViewed(postId: number, userId: number) {
    return this.prisma.view.upsert({
      where: { postId_userId: { postId, userId } },
      update: { isViewed: true },
      create: { postId, userId, isViewed: true },
    });
  }

  async likePost(postId: number, userId: number) {
    const existingLike = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      return { message: 'You have already liked this post.' };
    }

    await this.prisma.like.create({
      data: { postId, userId },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    });

    return { message: 'Post liked successfully.' };
  }


  async createComment(postId: number, userId: number, content: string) {
    try {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return await this.prisma.comment.create({
        data: {
          content,
          post: { connect: { id: postId } },
          user: { connect: { id: userId } },
        },
        include: {
          user: {
            select: {
              profilePictureUrl: true,
            },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error creating comment');
    }
  }

  async removeComment(postId: number, commentId: number) {
    return this.prisma.comment.deleteMany({
      where: {
        id: commentId,
        postId: postId,
      },
    });
  }

  async getPostWithDetails(postId: number) {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: { likes: true, comments: true },
        },
        comments: {
          select: {
            content: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });
  }

  async findPostsByUserId(userId: number) {
    return this.prisma.post.findMany({
      where: {
        authorId: userId,
      },
      include: {
        _count: {
          select: { likes: true, comments: true },
        },
        comments: {
          select: {
            content: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });
  }

  async findPostsByGameId(gameId: number) {
    return this.prisma.post.findMany({
      where: {
        gameId,
      },
      include: {
        _count: {
          select: { likes: true, comments: true },
        },
        comments: {
          select: {
            content: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });
  }
}
