import { Injectable, NotFoundException } from '@nestjs/common';
import { WebhookHandler } from './contracts/webhook-handler.interface';
import { StripeWebhookService } from './strategies/stripe-webhook.service';
import { WebhookProvider } from './types/webhook.types';

@Injectable()
export class WebhookStrategyManager {
    constructor(
        private readonly stripeWebhookService: StripeWebhookService,
        // Inject other webhook services here
    ) { }

    getStrategy(provider: WebhookProvider): WebhookHandler {
        switch (provider) {
            case WebhookProvider.STRIPE:
                return this.stripeWebhookService;
            default:
                throw new NotFoundException(`Webhook provider ${provider} not supported`);
        }
    }
}