import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionService {
    constructor(private prisma: PrismaService) { }

    async createSubscription(userId: number, type: string) {
        const price = type === 'GameDev' ? 19.9 : 5.9;
        return this.prisma.subscription.create({
            data: {
                type,
                price,
                user: { connect: { id: userId } },
            },
        });
    }

    async getSubscription(userId: number) {
        return this.prisma.subscription.findUnique({
            where: { userId },
        });
    }

    async cancelSubscription(userId: number) {
        return this.prisma.subscription.update({
            where: { userId },
            data: { isActive: false },
        });
    }

    async renewSubscription(userId: number) {
        return this.prisma.subscription.update({
            where: { userId },
            data: { isActive: true },
        });
    }
}
