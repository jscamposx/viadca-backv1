import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { UsuarioRol } from '../../entities/usuario.entity';

@Injectable()
export class AdminGuard extends AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const isAuthenticated = super.canActivate(context);

    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.rol !== UsuarioRol.ADMIN) {
      throw new ForbiddenException(
        'Acceso denegado. Se requieren permisos de administrador',
      );
    }

    return true;
  }
}
