import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import Stripe from 'stripe';
import { UserService } from '../user/user.service';
import { EmailService } from '../alerta_email/email.service'; // Import do serviço de e-mail
import { Cron, CronExpression } from '@nestjs/schedule'; // Import do cron job

@Injectable()
export class SubscriptionService {
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private readonly userService: UserService,
        private readonly emailService: EmailService, // Inserido o serviço de e-mail para fazer os alertas de expiração de assinatura
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
    }

    async createCheckoutSession(userId: number, type: string, successUrl: string, cancelUrl: string) {
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

    async createSubscription(userId: number, type: string) {
        const price = this.getPriceIdByType(type);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) throw new BadRequestException('Usuário não encontrado.');
        if (!price) throw new BadRequestException('Tipo de assinatura inválido.');

        const session = await this.createCheckoutSession(userId, type, '', '');
        const expiresAt = this.getExpiryDate();

        return this.prisma.subscription.create({
            data: {
                type,
                price: parseFloat(price),
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

    // Esse Cron job verifica quais as assinaturas estão próximas de expirar
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)//Essa parte faz a verificação sempre à meia-noite de cada dia
    async checkExpiringSubscriptions() {
        const today = new Date();
        const inThreeDays = new Date();
        inThreeDays.setDate(today.getDate() + 3);

        const expiringSubscriptions = await this.prisma.subscription.findMany({
            where: {
                expiresAt: { lte: inThreeDays },
                isActive: true,
            },
            include: { user: true },
        });

        for (const subscription of expiringSubscriptions) {
            const daysLeft = Math.ceil(
                (subscription.expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            await this.emailService.sendExpirationAlert(
                subscription.user.email,
                subscription.type,
                daysLeft
            );
        }
    }
}
