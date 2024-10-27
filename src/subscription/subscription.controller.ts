import { 
  Controller, Post, Get, Param, Body, Patch, BadRequestException 
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post()
  async createSubscription(
    @Body('userId') userId: number,
    @Body('type') type: string
  ) {
    if (!userId || !type) {
      throw new BadRequestException('userId e type são necessarias.');
    }
    return this.subscriptionService.createSubscription(userId, type);
  }

  @Get(':userId')
  async getSubscription(@Param('userId') userId: number) {
    const subscription = await this.subscriptionService.getSubscription(userId);
    if (!subscription) {
      throw new BadRequestException('Inscrição não encontrada.');
    }
    return subscription;
  }

  @Patch(':userId/cancel')
  async cancelSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.cancelSubscription(userId);
  }

  @Patch(':userId/renew')
  async renewSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.renewSubscription(userId);
  }

  @Get(':userId/stripe-session')
  async getStripeSession(@Param('userId') userId: number) {
    const subscription = await this.subscriptionService.getSubscription(userId);
    if (!subscription) {
      throw new BadRequestException('Inscrição não encontrada.');
    }
    return { stripeSessionId: subscription.stripeSessionId };
  }
}