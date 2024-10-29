import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../shared/database/prisma.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-09-30.acacia',
    });
  }

  public constructEventFromWebhook(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }

  async handleWebhookEvent(event: Stripe.Event) {
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
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = Number(session.client_reference_id);

    if (!userId) {
      throw new HttpException('Invalid session data: Missing user ID', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        Subscription: {
          update: {
            stripeId: session.subscription as string,
            stripeSessionId: session.id,
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias de validade
          },
        },
      },
    });
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
