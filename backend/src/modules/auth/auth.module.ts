import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthValidationService } from "./services/auth-validation.service";
import { AuthTokenService } from "./services/auth-token.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { User } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { Preferences } from "../../entities/preferences.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      TenantProfile,
      OperatorProfile,
      Preferences,
    ]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET", "your-secret-key"),
        signOptions: {
          expiresIn: configService.get("JWT_ACCESS_EXPIRES_IN", "1d"),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthValidationService,
    AuthTokenService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [
    AuthService,
    AuthValidationService,
    AuthTokenService,
    JwtStrategy,
    GoogleStrategy,
    PassportModule,
    TypeOrmModule,
  ],
})
export class AuthModule {}
