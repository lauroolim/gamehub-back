export enum WebhookProvider {
    STRIPE = 'stripe',

}

export interface WebhookResponse {
    success: boolean;
    message?: string;
    data?: Record<string, any>;
}