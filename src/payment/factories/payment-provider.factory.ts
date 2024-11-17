import { Injectable } from "@nestjs/common";
import { IPaymentProvider } from "../contracts/payment-provider.interface";
import { MercadoPagoPaymentStrategy } from "../strategies/mercadopago-payment.strategy";
import { StripePaymentStrategy } from "../strategies/stripe-payment.strategy";

@Injectable()
export class PaymentProviderFactory {
    constructor(
        private readonly stripeStrategy: StripePaymentStrategy,
        private readonly mercadoPagoStrategy: MercadoPagoPaymentStrategy
    ) { }

    createPaymentProvider(provider: string): IPaymentProvider {
        switch (provider.toLowerCase()) {
            case 'stripe':
                return this.stripeStrategy;
            case 'mercadopago':
                return this.mercadoPagoStrategy;
            default:
                throw new Error(`Provider de pagamento não suportado: ${provider}`);
        }
    }
}