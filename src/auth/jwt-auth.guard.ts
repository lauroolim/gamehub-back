import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedSocket } from '../chat/dto/user-socket.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const client: AuthenticatedSocket = context.switchToWs().getClient<AuthenticatedSocket>();
        const authHeader = client.handshake.auth?.token;

        if (!authHeader) {
            throw new UnauthorizedException('Token not provided');
        }

        const token = authHeader.split(' ')[1]; // "Bearer <token>"

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: number; username: string };

            // Armazena o usuário decodificado no client
            client.user = {
                userId: decoded.userId,
                username: decoded.username,
            };

            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
