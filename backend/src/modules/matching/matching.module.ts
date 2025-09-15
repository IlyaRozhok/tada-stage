import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { MatchingFilterService } from "./services/matching-filter.service";
import { MatchingMediaService } from "./services/matching-media.service";
import { MatchingNotificationService } from "./services/matching-notification.service";
import { MatchingCacheService } from "./services/matching-cache.service";
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
  providers: [
    MatchingService,
    MatchingCalculationService,
    MatchingFilterService,
    MatchingMediaService,
    MatchingNotificationService,
    MatchingCacheService,
    S3Service,
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
