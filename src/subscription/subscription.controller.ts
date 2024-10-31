import { Controller, Post, Param, Body, Patch, Get, Delete } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }


  @Post('checkout-session')
  async createCheckoutSession(
    @Body('userId') userId: number,
    @Body('type') type: 'GameDev' | 'GameDev Basic',
    @Body('successUrl') successUrl: string,
    @Body('cancelUrl') cancelUrl: string,
  ) {
    return this.subscriptionService.createCheckoutSession(userId, type, successUrl, cancelUrl);
  }

  @Patch(':userId')
  async updateSubscription(
    @Param('userId') userId: number,
    @Body('newType') newType: 'GameDev' | 'GameDev Basic',
  ) {
    return this.subscriptionService.updateSubscription(userId, newType);
  }

  @Get(':userId')
  async getSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.getSubscription(userId);
  }

  @Delete(':userId')
  async cancelSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.cancelSubscription(userId);
  }

  @Post(':userId/renew')
  async renewSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.renewSubscription(userId);
  }
}
