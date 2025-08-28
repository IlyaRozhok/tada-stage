import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ShortlistController } from "./shortlist.controller";
import { ShortlistService } from "./shortlist.service";
import { Property } from "../../entities/property.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, TenantProfile, User]),
    ConfigModule,
  ],
  controllers: [ShortlistController],
  providers: [ShortlistService, S3Service],
  exports: [ShortlistService],
})
export class ShortlistModule {}
