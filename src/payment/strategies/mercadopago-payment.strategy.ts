import { Injectable } from '@nestjs/common';
import { IPaymentProvider } from '../contracts/payment-provider.interface';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaService } from '../../shared/database/prisma.service';
import { SubscriptionService } from '../../subscription/subscription.service';

@Injectable()
export class MercadoPagoPaymentStrategy implements IPaymentProvider {
    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptionService: SubscriptionService
    ) { }

    verifyWebhookSignature(payload: any, signature: string): boolean {
        // Implementar verificação específica do PicPay
        return true;
    }

    async handleWebhookEvent(event: any): Promise<void> {
        switch (event.status) {
            case 'paid':
                await this.handlePaymentSucceeded(event);
                break;
            case 'failed':
                await this.handlePaymentFailed(event);
                break;
        }
    }

    private async handlePaymentSucceeded(event: any) {
        // Implementar lógica específica do PicPay
    }

    private async handlePaymentFailed(event: any) {
        // Implementar lógica específica do PicPay
    }

    async createPayment(amount: number, description: string, payerEmail: string) {
        const body = {
            transaction_amount: amount,
            description: description,
            payment_method_id: 'pix', // Replace with the desired payment method
            payer: {
                email: payerEmail,
            },
        };

        try {
            const response = await this.payment.create({ body });
            return response;
        } catch (error) {
            // Handle error appropriately
            throw error;
        }
    }
}