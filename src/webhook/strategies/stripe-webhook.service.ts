import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { WebhookHandler } from '../contracts/webhook-handler.interface';
import { PrismaService } from '../../shared/database/prisma.service';
import { SubscriptionService } from '../../subscription/subscription.service';

@Injectable()
export class StripeWebhookService implements WebhookHandler {
    private stripe: Stripe;

    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptionService: SubscriptionService,
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-09-30.acacia',
        });
    }

    validateSignature(payload: Buffer, signature: string): Stripe.Event {
        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
    }

    async handleEvent(event: Stripe.Event): Promise<void> {
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
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }
    }

    private async handleCheckoutSessionCompleted(event: Stripe.Event) {

    }

    private async handlePaymentSucceeded(event: Stripe.Event) {

    }

    private async handlePaymentFailed(event: Stripe.Event) {

    }
}
