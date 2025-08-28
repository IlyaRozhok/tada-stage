import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET", "your-secret-key"),
    });
  }

  async validate(payload: any) {
    console.log("🔍 JWT Strategy validate called with payload:", {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
    });

    const { sub: userId } = payload;

    if (!userId) {
      console.error("❌ No userId in JWT payload");
      throw new UnauthorizedException("Invalid token: no user ID");
    }

    console.log("🔍 Looking for user with ID:", userId);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      // Remove select to get all fields
    });

    if (!user) {
      console.error("❌ User not found in database:", userId);
      throw new UnauthorizedException("User not found");
    }

    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider,
      status: user.status,
      hasTenantProfile: !!user.tenantProfile,
      hasPreferences: !!user.preferences,
    });

    // Ensure the user object has all necessary computed properties
    const userWithComputedFields = {
      ...user,
      roles: user.roles, // This calls the getter
    };

    console.log("✅ Returning user with computed fields:", {
      id: userWithComputedFields.id,
      email: userWithComputedFields.email,
      role: userWithComputedFields.role,
      roles: userWithComputedFields.roles,
    });

    return userWithComputedFields;
  }
}
