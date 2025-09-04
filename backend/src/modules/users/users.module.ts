import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UserProfileService } from "./services/user-profile.service";
import { UserRoleService } from "./services/user-role.service";
import { User } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { Preferences } from "../../entities/preferences.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      TenantProfile,
      OperatorProfile,
      Preferences,
    ]),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserProfileService, UserRoleService],
  exports: [UsersService],
})
export class UsersModule {}
