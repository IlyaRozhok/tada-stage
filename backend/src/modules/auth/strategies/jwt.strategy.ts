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
    const jwtSecret = configService.get("JWT_SECRET", "your-secret-key");
    console.log("🔑 JWT Strategy initialized with secret:", jwtSecret ? "SET" : "NOT SET");
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter("token"),
        ExtractJwt.fromHeader("x-access-token"),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    console.log("🔍 JWT payload received:", payload);
    const { sub: userId } = payload;

    if (!userId) {
      console.error("❌ JWT validation failed: no user ID in payload");
      throw new UnauthorizedException("Invalid token: no user ID");
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      // Remove select to get all fields
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Ensure the user object has all necessary computed properties
    const userWithComputedFields = {
      ...user,
      roles: user.roles, // This calls the getter
    };

    return userWithComputedFields;
  }
}
