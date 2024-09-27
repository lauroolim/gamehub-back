import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AuthenticatedSocket } from './dto/user-socket.interface'; // Ajuste o caminho conforme necessário
import { Message } from './entities/message.entity'; // Ajuste o caminho conforme necessário

describe('ChatGateway', () => {
    let chatGateway: ChatGateway;
    let chatService: ChatService;

    const mockSocket = {
        handshake: {
            auth: {
                token: 'valid-token',
            },
        },
        emit: jest.fn(),
    } as unknown as AuthenticatedSocket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                {
                    provide: ChatService,
                    useValue: {
                        createMessage: jest.fn(),
                    },
                },
            ],
        }).compile();

        chatGateway = module.get<ChatGateway>(ChatGateway);
        chatService = module.get<ChatService>(ChatService);
    });

    describe('handleMessage', () => {
        it('should throw an error if required fields are missing', async () => {
            const payload = {
                event: 'message',
                data: {
                    senderId: 5,
                    receiverId: 6
                    // content e conversationId estão faltando
                },
            };

            await expect(chatGateway.handleMessage(mockSocket, payload)).rejects.toThrow(
                'Missing required fields: senderId, receiverId, or content',
            );
        });

        it('should call createMessage with valid data', async () => {
            const payload = {
                event: 'message',
                data: new Message(
                    5, // senderId
                    6, // receiverId
                    'Teste via WebSocket', // content
                    2 // conversationId
                ),
            };

            chatService.createMessage = jest.fn().mockResolvedValueOnce(payload.data);

            await chatGateway.handleMessage(mockSocket, payload);

            expect(chatService.createMessage).toHaveBeenCalledWith(payload.data);
        });

        it('should emit a message event with the created message', async () => {
            const createdMessage: Message = new Message(5, 6, 'Teste via WebSocket', 2, 1);

            const payload = {
                event: 'message',
                data: createdMessage,
            };

            chatService.createMessage = jest.fn().mockResolvedValueOnce(createdMessage);

            await chatGateway.handleMessage(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith('message', createdMessage);
        });
    });
});
