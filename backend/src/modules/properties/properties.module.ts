import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { PropertiesService } from "./properties.service";
import { PropertiesController } from "./properties.controller";
import { Property } from "../../entities/property.entity";
import { Favourite } from "../../entities/favourite.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { MatchingModule } from "../matching/matching.module";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      Favourite,
      Shortlist,
      User,
      TenantProfile,
    ]),
    MatchingModule,
    ConfigModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, S3Service],
  exports: [PropertiesService],
})
export class PropertiesModule {}
