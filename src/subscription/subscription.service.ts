import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import Stripe from 'stripe';
import { UserService } from '../user/user.service';

@Injectable()
export class SubscriptionService {
    private stripe: Stripe;

    constructor(private prisma: PrismaService, private readonly userService: UserService) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
    }

    private getPrice(type: string): number {
        switch (type) {
            case 'GameDev':
                return 19.9;
            case 'GameDev Basic':
                return 5.9;
            default:
                throw new BadRequestException('Tipo de assinatura inválido.');
        }
    }

    private async createStripeSession(priceId: string): Promise<Stripe.Checkout.Session> {
        return this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: 'https://your-app.com/success',
            cancel_url: 'https://your-app.com/cancel',
        });
    }

    async createCheckoutSession(userId: number, priceId: string) {
        try {
            const session = await this.createStripeSession(priceId);
            return session;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async createSubscription(userId: number, type: string) {
        const price = this.getPrice(type);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new BadRequestException('Usuário não encontrado.');

        const session = await this.createStripeSession(type);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return this.prisma.subscription.create({
            data: {
                type,
                price,
                isActive: true,
                userId,
                stripeSessionId: session.id,
                expiresAt,
            },
        });
    }

    async updateSubscription(userId: number, newType: string) {
        const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!subscription) throw new BadRequestException('Assinatura não encontrada.');

        const oldType = subscription.type;

        await this.prisma.planChange.create({
            data: {
                subscriptionId: subscription.id,
                oldPlan: oldType,
                newPlan: newType,
            },
        });

        return this.prisma.subscription.update({
            where: { userId },
            data: { type: newType },
        });
    }

    async getSubscription(userId: number) {
        return this.prisma.subscription.findUnique({ where: { userId } });
    }

    async cancelSubscription(userId: number) {
        return this.prisma.subscription.update({
            where: { userId },
            data: { isActive: false },
        });
    }

    async renewSubscription(userId: number) {
        const newExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return this.prisma.subscription.update({
            where: { userId },
            data: { isActive: true, expiresAt: newExpiryDate },
        });
    }
}
