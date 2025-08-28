import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    console.log("🔍 RolesGuard check:", {
      requiredRoles,
      user_id: user?.id,
      user_role: user?.role,
      user_roles: user?.roles,
      user_email: user?.email,
    });

    if (!user) {
      console.log("❌ RolesGuard: No user in request");
      return false;
    }

    // Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей
    // Поддерживаем как новый формат (role), так и старый (roles)
    if (user.role && requiredRoles.includes(user.role)) {
      console.log("✅ RolesGuard: User role matches", { user_role: user.role });
      return true;
    }
    if (Array.isArray(user.roles)) {
      const hasRole = requiredRoles.some((role) => user.roles.includes(role));
      console.log("✅ RolesGuard: User roles check", {
        user_roles: user.roles,
        hasRole,
      });
      return hasRole;
    }

    console.log("❌ RolesGuard: User does not have required roles");
    return false;
  }
}
