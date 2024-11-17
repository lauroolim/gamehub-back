import { Injectable } from '@nestjs/common';
import { IPaymentProvider } from '../contracts/payment-provider.interface';
import Stripe from 'stripe';
import { PrismaService } from '../../shared/database/prisma.service';
import { SubscriptionService } from '../../subscription/subscription.service';

@Injectable()
export class StripePaymentStrategy implements IPaymentProvider {
    private stripe: Stripe;

    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptionService: SubscriptionService
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-09-30.acacia',
        });
    }

    verifyWebhookSignature(payload: any, signature: string): boolean {
        try {
            this.stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            return true;
        } catch (error) {
            return false;
        }
    }

    async handleWebhookEvent(event: Stripe.Event): Promise<void> {
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
        }
    }

    private async handleCheckoutSessionCompleted(event: Stripe.Event) {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata['userId'], 10);
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId) {
            throw new Error('userId não encontrado no metadata da sessão.');
        }

        await this.subscriptionService.createSubscription(userId, subscriptionId, customerId);
    }

    private async handlePaymentSucceeded(event: Stripe.Event) {
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

    private async handlePaymentFailed(event: Stripe.Event) {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = invoice.customer_email;

        if (!customerEmail) return;

        const user = await this.prisma.user.findUnique({
            where: { email: customerEmail },
        });

        if (user) {
            await this.prisma.subscription.updateMany({
                where: { userId: user.id },
                data: { isActive: false },
            });
        }
    }
}
