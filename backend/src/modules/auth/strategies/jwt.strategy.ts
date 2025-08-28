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
    const { sub: userId } = payload;

    if (!userId) {
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
