import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors,
  UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { LikeDto } from './dto/like.dto';
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
          new FileTypeValidator({ fileType: /image\/(png|jpg|jpeg)|video\/(mp4|avi|mov)/ }),
        ],
      })
    ) file?: Express.Multer.File,
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

  @Patch(':postId/view/:userId')
  markAsViewed(
    @Param('postId') postId: string,
    @Param('userId') userId: string
  ) {
    return this.postService.isViewed(+postId, +userId);
  }

  @Post(':postId/comments')
  addComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.postService.addComment({ ...createCommentDto, postId: +postId });
  }

  @Post(':postId/like')
  likePost(
    @Param('postId') postId: string,
    @Body() likeDto: LikeDto
  ) {
    return this.postService.likePost({ ...likeDto, postId: +postId });
  }
}
