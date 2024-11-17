import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookStrategyManager } from './webhook-strategy.manager';
import { StripeWebhookService } from './strategies/stripe-webhook.service';
import { MercadoPagoWebhookService } from './strategies/mercado-pago-webhook.service';

@Module({
    controllers: [WebhookController],
    providers: [
        WebhookStrategyManager,
        StripeWebhookService,
        MercadoPagoWebhookService,
    ],
})
export class WebhookModule {
    constructor(
        private readonly strategyManager: WebhookStrategyManager,
        private readonly stripeService: StripeWebhookService,
        private readonly mercadoPagoService: MercadoPagoWebhookService,
    ) {
        this.strategyManager.registerStrategy('stripe', stripeService);
        this.strategyManager.registerStrategy('mercadopago', mercadoPagoService);
    }
}