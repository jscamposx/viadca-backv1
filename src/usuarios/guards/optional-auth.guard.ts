import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { UsuariosService } from '../usuarios.service';

/**
 * Guard de autenticación OPCIONAL
 * Si hay token, lo valida y lo agrega a req.user
 * Si NO hay token, permite el acceso (req.user queda undefined)
 * Útil para endpoints que funcionan con y sin autenticación
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
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

    // Si no hay token, permitir acceso sin usuario
    if (!token) {
      request.user = null;
      return true;
    }

    try {
      // Si hay token, validarlo y agregar el payload a request
      const payload = this.usuariosService.verifyToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      // Si el token es inválido, permitir acceso sin usuario
      // (no lanzamos error, solo marcamos como null)
      request.user = null;
      return true;
    }
  }
}
