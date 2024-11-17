import { Injectable } from '@nestjs/common';
import { WebhookHandler } from './contracts/webhook-handler.interface';

@Injectable()
export class WebhookStrategyManager {
    private strategies: { [key: string]: WebhookHandler } = {};

    registerStrategy(name: string, strategy: WebhookHandler) {
        this.strategies[name] = strategy;
    }

    getStrategy(name: string): WebhookHandler {
        const strategy = this.strategies[name];
        if (!strategy) {
            throw new Error(`Webhook strategy "${name}" not found`);
        }
        return strategy;
    }
}
