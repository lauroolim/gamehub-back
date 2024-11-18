import { Injectable, UnauthorizedException } from '@nestjs/common';
import { WebhookHandler } from '../contracts/webhook-handler.interface';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionService } from '../../subscription/subscription.service';

@Injectable()
export class StripeWebhookService implements WebhookHandler<Stripe.Event> {
    private readonly stripe: Stripe;
    private readonly webhookSecret: string;

    constructor(private readonly configService: ConfigService, private readonly subscriptionService: SubscriptionService) {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY not configured');
        }

        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!this.webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET not configured');
        }

        this.stripe = new Stripe(apiKey, {
            apiVersion: '2024-09-30.acacia',
        });
    }

    async validateSignature(
        payload: Buffer | string,
        signature: string
    ): Promise<Stripe.Event> {
        try {
            const rawBody = typeof payload === 'string' ? Buffer.from(payload) : payload;

            return this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                this.webhookSecret
            );
        } catch (error) {
            throw new UnauthorizedException(
                `Invalid webhook signature: ${error.message}`
            );
        }
    }

    async handleEvent(event: Stripe.Event): Promise<void> {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, event);
                break;

            case 'payment_intent.payment_failed':
                await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case 'customer.subscription.created':
                await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }

    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, event: Stripe.Event): Promise<void> {
        const session = event.data.object as Stripe.Checkout.Session;

        const userIdString = session.metadata['userId'];
        const userId = parseInt(userIdString, 10);

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId) {
            console.error('userId não encontrado no metadata da sessão.');
            return;
        }

        await this.subscriptionService.createSubscription(userId, subscriptionId, customerId);
    }

    private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {

        console.log('Payment failed:', paymentIntent.id);
    }

    private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {

        console.log('Subscription created:', subscription.id);
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {

        console.log('Subscription updated:', subscription.id);
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {

        console.log('Subscription deleted:', subscription.id);
    }
}