import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import Stripe from 'stripe';
import { UserService } from '../user/user.service';

@Injectable()
export class SubscriptionService {
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private readonly userService: UserService
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
    }

    async createCheckoutSession(
        userId: number,
        type: string,
        successUrl: string,
        cancelUrl: string,
    ) {
        const priceId = this.getPriceIdByType(type);

        if (!priceId) {
            throw new BadRequestException('Invalid subscription type.');
        }

        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: { userId: userId.toString() },
            });

            return session;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    private getPriceIdByType(type: string): string | null {
        switch (type) {
            case 'GameDev':
                return process.env.STRIPE_PRICE_GAMEDEV;
            case 'GameDev Basic':
                return process.env.STRIPE_PRICE_GAMEDEV_BASIC;
            default:
                return null;
        }
    }

    private getTypeByPriceId(priceId: string): string | null {
        if (priceId === process.env.STRIPE_PRICE_GAMEDEV) {
            return 'GameDev';
        } else if (priceId === process.env.STRIPE_PRICE_GAMEDEV_BASIC) {
            return 'GameDev Basic';
        }
        return null;
    }

    async createSubscription(
        userId: number,
        stripeSubscriptionId: string,
        stripeCustomerId: string,
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new BadRequestException('Usuário não encontrado.');

        const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
        const type = this.getTypeByPriceId(stripeSubscription.items.data[0].price.id);

        if (!type) throw new BadRequestException('Tipo de assinatura inválido.');

        const priceAmount = stripeSubscription.items.data[0].price.unit_amount / 100;

        return this.prisma.subscription.create({
            data: {
                userId,
                type,
                price: priceAmount,
                isActive: true,
                stripeId: stripeSubscriptionId,
                stripeCustomerId: stripeCustomerId,
                expiresAt: this.getExpiryDate(),
            },
        });
    }

    async updateSubscription(userId: number, newType: string) {
        const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!subscription) throw new BadRequestException('Assinatura não encontrada.');

        const newPriceId = this.getPriceIdByType(newType);
        if (!newPriceId) throw new BadRequestException('Tipo de assinatura inválido.');

        await this.prisma.planChange.create({
            data: {
                subscriptionId: subscription.id,
                oldPlan: subscription.type,
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
        const newExpiryDate = this.getExpiryDate();

        return this.prisma.subscription.update({
            where: { userId },
            data: { isActive: true, expiresAt: newExpiryDate },
        });
    }

    private getExpiryDate(): Date {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
}
