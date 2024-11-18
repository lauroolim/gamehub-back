export class WebhookProcessingException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebhookProcessingException';
    }
}