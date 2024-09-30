import { Message } from "../entities/message.entity";

export interface ServerResponse {
    message: (payload: Message) => void;
}