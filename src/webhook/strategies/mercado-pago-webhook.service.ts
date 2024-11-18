import { Injectable, Logger } from '@nestjs/common';
import { WebhookHandler } from '../contracts/webhook-handler.interface';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { MercadoPagoConfig } from 'mercadopago';

@Injectable()
export class MercadoPagoWebhookService implements WebhookHandler {
    private readonly logger = new Logger(MercadoPagoWebhookService.name);
    private client: MercadoPagoConfig;
    private readonly webhookSecret: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
        if (!accessToken) {
            throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
        }
        this.client = new MercadoPagoConfig({
            accessToken: accessToken,
        });

        this.webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
        if (!this.webhookSecret) {
            throw new Error('MERCADOPAGO_WEBHOOK_SECRET not configured');
        }
    }

    validateSignature(payload: Buffer, signature: string): any {
        return JSON.parse(payload.toString());
    }

    async handleEvent(event: any): Promise<void> {
        switch (event.type) {
            case 'payment':
                await this.handlePayment(event.data.id);
                break;
            case 'plan':
                await this.handlePlan(event.data.id);
                break;
            case 'subscription':
                await this.handleSubscription(event.data.id);
                break;
            case 'invoice':
                await this.handleInvoice(event.data.id);
                break;
            case 'point_integration_wh':
                this.logger.log('Point integration webhook received', event);
                break;
            default:
                this.logger.warn(`Unhandled Mercado Pago event type: ${event.type}`);
        }
    }

    private async handlePayment(paymentId: string): Promise<void> {


    }

    private async handlePlan(planId: string): Promise<void> {


    }

    private async handleSubscription(subscriptionId: string): Promise<void> {


    }

    private async handleInvoice(invoiceId: string): Promise<void> {


    }
}