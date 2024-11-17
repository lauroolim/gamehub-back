import { Controller, Post, Req, Res, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookStrategyManager } from './webhook-strategy.manager';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly strategyManager: WebhookStrategyManager) { }

    @Post(':provider')
    @UseGuards()
    async handleWebhook(
        @Param('provider') provider: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const sig = req.headers['x-signature'] || req.headers['stripe-signature'];
        const payload = req.body;

        try {
            const strategy = this.strategyManager.getStrategy(provider);
            const event = strategy.validateSignature(payload, sig as string);
            await strategy.handleEvent(event);
            res.json({ received: true });
        } catch (error) {
            console.error(error);
            throw new HttpException('Webhook handling failed', HttpStatus.BAD_REQUEST);
        }
    }
}