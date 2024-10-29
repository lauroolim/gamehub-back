import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { UserService } from '../user/user.service';

@Injectable()
export class SubscriptionService {
    private stripe: Stripe;

    constructor(private prisma: PrismaService, private readonly userService: UserService) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
    }

    async createCheckoutSession(userId: number, priceId: string, successUrl: string, cancelUrl: string) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId, // Use o ID do preço criado no Stripe
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId: userId.toString(),
                },
            });

            return session;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }




    async createSubscription(userId: number, type: string) {
        const price = type === 'GameDev' ? 19.9 : 5.9;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('Usuário não encontrado.');

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price_data: { currency: 'brl', product_data: { name: type }, unit_amount: price * 100 }, quantity: 1 }],
            mode: 'subscription',
            success_url: 'https://your-app.com/success',
            cancel_url: 'https://your-app.com/cancel',
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

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
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);

        return this.prisma.subscription.update({
            where: { userId },
            data: { isActive: true, expiresAt: newExpiryDate },
        });
    }
}
