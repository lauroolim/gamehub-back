import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'ws') {
      return true;
    }

    const client: Socket = context.switchToWs().getClient();
    const { authorization } = client.handshake.headers;

    // Verifica se o header de autorização está presente
    if (!authorization) {
      this.logger.warn('Token não fornecido');
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      // Extrai o token da string "Bearer <token>"
      const token = authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: number; username: string };

      // Armazena o usuário decodificado no socket
      (client as any).user = {
        userId: decoded.userId,
        username: decoded.username,
      };

      this.logger.log(`Usuário autenticado: ${JSON.stringify((client as any).user)}`);
      return true;
    } catch (error) {
      this.logger.error('Token inválido', error.stack);
      throw new UnauthorizedException('Token inválido');
    }
  }
}
