export class Message {
    id?: number; // O id pode ser opcional
    senderId: number;
    receiverId: number;
    content: string;
    conversationId: number;
    createdAt?: Date; // O createdAt pode ser opcional, dependendo de como você está gerenciando isso

    constructor(
        senderId: number,
        receiverId: number,
        content: string,
        conversationId: number,
        id?: number,
        createdAt?: Date
    ) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.conversationId = conversationId;
        this.id = id;
        this.createdAt = createdAt || new Date(); // Se não for fornecido, usa a data atual
    }
}
