export enum WebhookProvider {
    STRIPE = 'stripe',
    MERCADO_PAGO = 'mercado-pago',
}

export interface WebhookResponse {
    success: boolean;
    message?: string;
    data?: Record<string, any>;
}