import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Preferences, User]),
    ConfigModule,
  ],
  controllers: [MatchingController],
  providers: [MatchingService, S3Service],
  exports: [MatchingService],
})
export class MatchingModule {}
