import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsuariosService } from '../usuarios.service';

@Injectable()
export class OptionalAuthMiddleware implements NestMiddleware {
  constructor(private usuariosService: UsuariosService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = this.usuariosService.verifyToken(token);
        req['user'] = payload;
      } catch (error) {}
    }

    next();
  }
}
