export interface WebhookHandler<T = unknown> {
    validateSignature(payload: Buffer | string, signature: string): Promise<T>;
    handleEvent(event: T): Promise<void>;
}