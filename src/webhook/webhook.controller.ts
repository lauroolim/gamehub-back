import { Controller, Post, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { WebhookStrategyManager } from './webhook-strategy.manager';
import { Request, Response } from 'express';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly strategyManager: WebhookStrategyManager) { }

    @Post(':provider')
    async handleWebhook(@Req() req: Request, @Res() res: Response) {
        const { provider } = req.params;
        const sig = req.headers['x-signature'] || req.headers['stripe-signature'];
        const payload = req.body;

        try {
            const strategy = this.strategyManager.getStrategy(provider);
            const event = strategy.validateSignature(payload, sig as string);
            await strategy.handleEvent(event);
            res.json({ received: true });
        } catch (error) {
            console.error(`Webhook error: ${error.message}`);
            res.status(500).send(`Webhook handler error: ${error.message}`);
        }
    }
}
