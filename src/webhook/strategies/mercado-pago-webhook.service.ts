import { Injectable } from '@nestjs/common';
import { WebhookHandler } from '../contracts/webhook-handler.interface';

@Injectable()
export class MercadoPagoWebhookService implements WebhookHandler {
    validateSignature(payload: Buffer, signature: string): any {
        return JSON.parse(payload.toString());
    }

    async handleEvent(event: any): Promise<void> {
        switch (event.type) {
            case 'payment.created':
                await this.handlePaymentCreated(event);
                break;
            case 'payment.failed':
                await this.handlePaymentFailed(event);
                break;
            default:
                console.log(`Unhandled Mercado Pago event type: ${event.type}`);
        }
    }

    private async handlePaymentCreated(event: any) {

    }

    private async handlePaymentFailed(event: any) {

    }
}
