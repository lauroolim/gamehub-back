export interface IPaymentProvider {
    verifyWebhookSignature(payload: any, signature: string): boolean;
    handleWebhookEvent(event: any): Promise<void>;
}