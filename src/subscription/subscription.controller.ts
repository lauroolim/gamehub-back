import { Controller, Post, Param, Body, Patch, Get, Delete } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  // Rota para criar uma sessão de checkout com o Stripe
  @Post('checkout-session')
  async createCheckoutSession(
    @Body('userId') userId: number,
    @Body('priceId') priceId: string, // Alterado de 'type' para 'priceId'
    @Body('successUrl') successUrl: string,
    @Body('cancelUrl') cancelUrl: string,
  ) {
    return this.subscriptionService.createCheckoutSession(userId, priceId, successUrl, cancelUrl);
  }

  // Rota para atualizar o tipo de uma assinatura existente
  @Patch(':userId')
  async updateSubscription(
    @Param('userId') userId: number,
    @Body('newType') newType: string,
  ) {
    return this.subscriptionService.updateSubscription(userId, newType);
  }

  // Rota para obter a assinatura de um usuário
  @Get(':userId')
  async getSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.getSubscription(userId);
  }

  // Rota para cancelar uma assinatura
  @Delete(':userId')
  async cancelSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.cancelSubscription(userId);
  }

  // Rota para renovar uma assinatura
  @Post(':userId/renew')
  async renewSubscription(@Param('userId') userId: number) {
    return this.subscriptionService.renewSubscription(userId);
  }
}
