import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionService {
    constructor(private prisma: PrismaService) { }

    async createSubscription(userId: number, type: string) {
        const price = type === 'GameDev' ? 19.9 : 5.9;
        
        // Define a data de expiração para 30 dias no futuro
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
    
        return this.prisma.subscription.create({
          data: {
            type,
            price,
            user: { connect: { id: userId } },
            expiresAt, // Campo obrigatório
            stripeSessionId: 'dummy-session-id', // Substitua pelo valor correto ou integre com o Stripe
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
