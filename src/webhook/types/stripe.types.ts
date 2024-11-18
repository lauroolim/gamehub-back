export interface CheckoutSessionResponse {
    id: string;
    url: string;
    amount_total: number;
    currency: string;
    expires_at: number;
    metadata: {
        userId?: string;
    };
    payment_status: 'paid' | 'unpaid';
    status: 'open' | 'complete' | 'expired';
    mode: 'subscription' | 'payment';
}