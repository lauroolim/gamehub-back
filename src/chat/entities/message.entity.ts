export class Message {
    id?: number;
    senderId: number;
    receiverId: number;
    content: string;
    conversationId: number;
    createdAt?: Date;

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
        this.createdAt = createdAt || new Date();
    }
}
