import { Injectable, NotFoundException } from '@nestjs/common';
import { WebhookHandler } from './contracts/webhook-handler.interface';
import { StripeWebhookService } from './strategies/stripe-webhook.service';
import { WebhookProvider } from './types/webhook.types';
import { MercadoPagoWebhookService } from './strategies/mercado-pago-webhook.service';

@Injectable()
export class WebhookStrategyManager {
    constructor(
        private readonly stripeWebhookService: StripeWebhookService,
        private readonly mercadoPagoWebhookService: MercadoPagoWebhookService,
    ) { }

    getStrategy(provider: WebhookProvider): WebhookHandler {
        switch (provider) {
            case WebhookProvider.STRIPE:
                return this.stripeWebhookService;
            case WebhookProvider.MERCADO_PAGO:
                return this.mercadoPagoWebhookService;
            default:
                throw new NotFoundException(`Webhook provider ${provider} not supported`);
        }
    }
}