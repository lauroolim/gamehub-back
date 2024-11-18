import { Controller, Post, Req, Res, Param, HttpException, HttpStatus, UseGuards, UnauthorizedException, Headers, RawBody, UseInterceptors, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookStrategyManager } from './webhook-strategy.manager';
import { WebhookProvider, WebhookResponse } from './types/webhook.types';

@Controller('webhook')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private readonly strategyManager: WebhookStrategyManager,
    ) { }

    @Post(':provider')
    async handleWebhook(
        @Param('provider') provider: WebhookProvider,
        @RawBody() rawBody: Buffer,
        @Headers() headers: Record<string, string>,
    ): Promise<WebhookResponse> {
        try {
            const signature = this.getSignatureFromHeaders(provider, headers);
            if (!signature) {
                throw new UnauthorizedException('Missing webhook signature');
            }

            const strategy = this.strategyManager.getStrategy(provider);
            const event = await strategy.validateSignature(rawBody, signature);
            await strategy.handleEvent(event);

            return { success: true };
        } catch (error) {
            this.logger.error('Webhook processing failed', {
                provider,
                error: error.message,
            });

            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new HttpException(
                { success: false, message: 'Webhook processing failed' },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    private getSignatureFromHeaders(
        provider: WebhookProvider,
        headers: Record<string, string>,
    ): string | undefined {
        const signatureMap: Record<WebhookProvider, string> = {
            [WebhookProvider.STRIPE]: 'stripe-signature',
            [WebhookProvider.MERCADO_PAGO]: 'x-signature',
            //providers sao aq
        };

        const headerKey = signatureMap[provider]?.toLowerCase();
        return headerKey ? headers[headerKey] : undefined;
    }
}