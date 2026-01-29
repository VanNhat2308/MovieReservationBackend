// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../enums/roles.enum';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.role) {
      throw new ForbiddenException('Unauthorized access');
    }

    // ADMIN luôn được phép mọi thứ (bypass tất cả role check)
    if (user.role === RoleName.ADMIN) {
      return true;
    }

    // USER chỉ được nếu route yêu cầu USER
    return requiredRoles.includes(user.role);
  }
}