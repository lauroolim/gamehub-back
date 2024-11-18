import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { User } from './types/user.types';

@Injectable()
export class SubscriptionService {
    private readonly stripe: Stripe;
    private readonly logger = new Logger(SubscriptionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const stripeKey = this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
        this.stripe = new Stripe(stripeKey, {
            apiVersion: '2024-09-30.acacia'
        });
    }
    receivedFriendships: any[] = [];
    sentFriendships: any[] = [];

    async createCheckoutSession(
        userId: number,
        type: string,
        successUrl: string,
        cancelUrl: string,
    ) {
        try {
            const user = await this.validateUserForSubscription(userId);

            const priceId = this.getPriceIdByType(type);
            if (!priceId) {
                throw new BadRequestException('Invalid subscription type.');
            }

            const metadata = {
                userId: userId.toString(),
                subscriptionType: type,
                username: user.username,
                gameCategories: user.GameUser.map(gu => gu.game.category).join(',')
            };

            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1
                    },
                ],
                mode: 'subscription',
                success_url: this.sanitizeUrl(successUrl),
                cancel_url: this.sanitizeUrl(cancelUrl),
                metadata,
                customer_email: user.email,
                allow_promotion_codes: true,
                billing_address_collection: 'required',
                currency: 'brl',
                locale: 'pt-BR',
                payment_method_collection: 'always',
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
                custom_text: {
                    submit: {
                        message: 'Ao assinar, você concorda com nossos termos de serviço'
                    },
                }
            });

            return {
                id: session.id,
                url: session.url,
                amount_total: session.amount_total,
                currency: session.currency,
                expires_at: session.expires_at,
                metadata: session.metadata,
                payment_status: session.payment_status,
                status: session.status,
                mode: session.mode
            };
        } catch (error) {
            this.logger.error('Failed to create checkout session', {
                userId,
                type,
                error: error.message,
                stack: error.stack
            });
            throw new BadRequestException(
                error.message || 'Failed to create checkout session'
            );
        };
    }

    private async validateUserForSubscription(userId: number): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                Subscription: true,
                GameUser: {
                    include: {
                        game: true
                    },
                }
            }
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.Subscription?.isActive) {
            throw new BadRequestException('User already has an active subscription');
        }

        if (user.GameUser.length === 0) {
            throw new BadRequestException('User must have at least one game preference');
        }

        return {
            ...user,
            receivedFriendships: this.receivedFriendships,
            sentFriendships: this.sentFriendships
        };
    }

    async createSubscription(userId: number, subscriptionId: string, customerId: string): Promise<void> {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

            const expiresAt = new Date(subscription.current_period_end * 1000);
            const type = subscription.metadata.subscriptionType;

            const price = subscription.items.data[0].plan?.amount ?? 0 / 100;

            await this.prisma.subscription.create({
                data: {
                    userId: userId,
                    type: type,
                    expiresAt: expiresAt,
                    price: price,
                    stripeId: subscription.id,
                    stripeCustomerId: customerId,
                }
            });

            this.logger.debug('Created subscription', {
                userId,
                subscriptionId,
                type,
                expiresAt,
                price,
                stripeId: subscription.id,
                stripeCustomerId: customerId,
            });
        } catch (error) {
            this.logger.error('Error creating subscription', { error });
        }
    }


    private getPriceIdByType(type: string): string | null {
        const priceMap = {
            'GameDev': this.configService.get('STRIPE_PRICE_GAMEDEV'),
            'GameDev Basic': this.configService.get('STRIPE_PRICE_GAMEDEV_BASIC'),
        };

        const price = priceMap[type];
        if (!price) {
            this.logger.warn(`Invalid subscription type requested: ${type}`);
            return null;
        }

        return price;
    }

    private sanitizeUrl(url: string): string {
        const allowedDomains = [
            'myapp.com',
            'localhost',
            'checkout.stripe.com'
        ];

        try {
            const parsedUrl = new URL(url);
            if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
                throw new BadRequestException('Invalid redirect URL domain');
            }
            return url;
        } catch (error) {
            throw new BadRequestException('Invalid URL format');
        }
    }
}