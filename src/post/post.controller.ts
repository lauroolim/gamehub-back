import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createPost(
    @Body() body: { authorId: string; content: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /image\/(png|jpg|jpeg)|video\/(mp4|avi|mov)/,
          }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    const createPostDto: CreatePostDto = {
      authorId: parseInt(body.authorId, 10),
      content: body.content,
    };

    return this.postService.create(createPostDto, file);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }

  @Delete(':postId/comment/:commentId')
  removeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.postService.removeComment(+postId, +commentId);
  }

  @Patch(':postId/view/:userId')
  markAsViewed(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    return this.postService.isViewed(+postId, +userId);
  }

  @Post(':postId/like')
  async likePost(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
  ) {
    return this.postService.likePost(+postId, +userId);
  }

  @Post(':postId/comment')
  async commentOnPost(
    @Param('postId') postId: string,
    @Body() body: { userId: string; content: string },
  ) {
    return this.postService.createComment(+postId, +body.userId, body.content);
  }

  @Get(':postId/details')
  async getPostDetails(@Param('postId') postId: string) {
    return this.postService.getPostWithDetails(+postId);
  }
}
