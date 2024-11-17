export interface WebhookHandler {
    validateSignature(payload: Buffer, signature: string): any;
    handleEvent(event: any): Promise<void>;
}
