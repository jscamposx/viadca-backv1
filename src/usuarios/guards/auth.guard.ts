import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuariosService } from '../usuarios.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private usuariosService: UsuariosService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    try {
      const payload = this.usuariosService.verifyToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
