import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Query, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) { }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Post('gamedev/mercado-pago-account')
  async createMercadoPagoAccount(@Body() body: { userId: number, mercadoPagoId: string }) {
    return this.usersService.addMercadoPagoAccountId(body.userId, body.mercadoPagoId);
  }

  @Get('search/username')
  async findByUsername(
    @Query('username') username: string,
    @Query('page') page: number = 1, // Página padrão 1
    @Query('limit') limit: number = 10, // Limite padrão 10
  ) {
    if (!username) {
      throw new BadRequestException('Username query parameter is required');
    }

    return this.usersService.findByUsername(username, page, limit);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('profilePicture', {
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  }))
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(id, updateUserDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
