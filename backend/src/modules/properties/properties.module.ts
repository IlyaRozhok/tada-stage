import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { PropertiesService } from "./properties.service";
import { PropertiesController } from "./properties.controller";
import { PropertyMediaService } from "./services/property-media.service";
import { Property } from "../../entities/property.entity";
import { PropertyMedia } from "../../entities/property-media.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { MatchingModule } from "../matching/matching.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      PropertyMedia,
      Shortlist,
      User,
      TenantProfile,
    ]),
    MatchingModule,
    ConfigModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyMediaService],
  exports: [PropertiesService, PropertyMediaService],
})
export class PropertiesModule {}
