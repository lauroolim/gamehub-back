import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) { }

  @Post(':userId')
  async createSubscription(
    @Param('userId') userId: number,
    @Body('type') type: string
  ) {
    return this.subscriptionService.createSubscription(userId, type);
  }

  @Get(':userId')
  async getSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.getSubscription(userId);
  }

  @Patch(':userId/cancel')
  async cancelSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.cancelSubscription(userId);
  }

  @Patch(':userId/renew')
  async renewSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.renewSubscription(userId);
  }
}
