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

  private getPriceId(plan: 'basic' | 'premium'): string {
    return plan === 'basic'
      ? process.env.STRIPE_BASIC_PLAN_ID
      : process.env.STRIPE_PREMIUM_PLAN_ID;
  }

  async createOrUpdateSubscription(userId: number, plan: 'basic' | 'premium') {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const existingSubscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      if (existingSubscription) {
        await this.stripe.subscriptions.update(existingSubscription.id.toString(), {
          items: [{ price: this.getPriceId(plan) }],
          proration_behavior: 'none',
        });

        await this.prisma.subscription.update({
          where: { userId },
          data: {
            type: plan,
            price: plan === 'basic' ? 5.9 : 19.9,
            expiresAt,
          },
        });

        return { message: 'Subscription updated successfully' };
      } else {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          customer_email: user.email,
          line_items: [
            {
              price: this.getPriceId(plan),
              quantity: 1,
            },
          ],
          success_url: `http://localhost:3000/sucesso`,
          cancel_url: `http://localhost:3000/cancelado`,
        });

        await this.prisma.subscription.create({
          data: {
            stripeSessionId: session.id, // Armazena o ID da sessão Stripe
            userId,
            type: plan,
            price: plan === 'basic' ? 5.9 : 19.9,
            isActive: true,
            expiresAt,
          },
        });

        return { sessionId: session.id };
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}