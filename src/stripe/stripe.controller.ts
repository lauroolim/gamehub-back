import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-or-update-subscription')
  async createOrUpdateSubscription(
    @Body() data: { userId: number; plan: 'basic' | 'premium' }
  ) {
    return this.stripeService.createOrUpdateSubscription(data.userId, data.plan);
  }
}
