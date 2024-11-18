import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import Stripe from 'stripe';
import { WebhookHandler } from '../contracts/webhook-handler.interface';
import { PrismaService } from '../../shared/database/prisma.service';
import { SubscriptionService } from '../../subscription/subscription.service';
import { ConfigService } from '@nestjs/config';
import { WebhookProcessingException } from '../exceptions/webhook-processing.exception';
import { WebhookProvider } from '../types/webhook.types';

@Injectable()
export class StripeWebhookService implements WebhookHandler<Stripe.Event> {
    private readonly stripe: Stripe;
    private readonly logger = new Logger(StripeWebhookService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptionService: SubscriptionService,
        private readonly configService: ConfigService,
    ) {
        const secretKey = this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2024-09-30.acacia',
        });
    }

    async validateSignature(
        payload: Buffer | string,
        signature: string,
    ): Promise<Stripe.Event> {
        try {
            const webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
            return this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret,
            );
        } catch (error) {
            this.logger.error('Invalid webhook signature', { error });
            throw new UnauthorizedException('Invalid webhook signature');
        }
    }

    async handleEvent(event: Stripe.Event): Promise<void> {
        try {
            this.logger.debug(`Processing Stripe event: ${event.type}`, { eventId: event.id });

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event);
                    break;
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event);
                    break;
                default:
                    this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
            }
        } catch (error) {
            this.logger.error('Error processing webhook event', {
                error,
                eventId: event.id,
                eventType: event.type,
            });
            throw new WebhookProcessingException(error.message);
        }
    }

    private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.metadata?.userId) {
            throw new WebhookProcessingException('Missing userId in session metadata');
        }

        const userId = parseInt(session.metadata.userId, 10);
        if (isNaN(userId)) {
            throw new WebhookProcessingException('Invalid userId format');
        }

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        await this.subscriptionService.createSubscription(
            userId,
            subscriptionId,
            customerId,
        );
    }

    private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = invoice.customer_email;

        if (!customerEmail) return;

        const user = await this.prisma.user.findUnique({
            where: { email: customerEmail },
        });

        if (user) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await this.prisma.subscription.updateMany({
                where: { userId: user.id },
                data: { isActive: true, expiresAt },
            });
        }
    }

    private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
        const invoice = event.data.object as Stripe.Invoice;

        if (!invoice.customer_email) {
            throw new WebhookProcessingException('Missing customer email');
        }

        const user = await this.prisma.user.findUnique({
            where: { email: invoice.customer_email },
        });

        if (!user) {
            throw new WebhookProcessingException('User not found');
        }

        await this.prisma.subscription.updateMany({
            where: { userId: user.id },
            data: {
                isActive: false,
            },
        });
    }
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
