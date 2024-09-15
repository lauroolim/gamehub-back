import { Injectable } from '@nestjs/common';
import { PrismaService } from './../shared/database/prisma.service';

@Injectable()
export class UserService {
    constructor(private readonly PrismaService: PrismaService,) { }

    async findAll() {
        return this.PrismaService.user.findMany();
    }

    async findOne(id: string) {
        return this.PrismaService.user.findUnique({
            where: {
                id: parseInt(id),
            },
        });
    }

    async update(id: string, updateUserDto) {
        return this.PrismaService.user.update({
            where: {
                id: parseInt(id),
            },
            data: updateUserDto,
        });
    }

    async remove(id: string) {
        return this.PrismaService.user.delete({
            where: {
                id: parseInt(id),
            },
        });
    }
}
