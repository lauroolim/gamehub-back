import { Injectable, ConflictException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
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
    await this.s3Client.send(command);
    return `https://midias-app-gamehub.s3.amazonaws.com/${fileName}`;
  }

  async create(createPostDto: CreatePostDto, file?: Express.Multer.File) {
    let imageUrl: string | null = null;

    if (file) {
      const fileName = `${Date.now()}-${file.originalname}`;
      imageUrl = await this.uploadFile(fileName, file.buffer);
    }

    return this.prisma.post.create({
      data: {
        content: createPostDto.content,
        authorId: createPostDto.authorId,
        imageUrl,
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
      return this.prisma.like.delete({
        where: { postId_userId: { postId, userId } },
      });
    }

    return this.prisma.like.create({
      data: {
        postId,
        userId,
      },
    });
  }


  async createComment(postId: number, userId: number, content: string) {
    return this.prisma.comment.create({
      data: {
        postId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
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
              },
            },
            createdAt: true,
          },
        },
      },
    });
  }
}
