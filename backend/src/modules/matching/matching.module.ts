import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { MatchingMediaService } from "./services/matching-media.service";
import { MatchingNotificationService } from "./services/matching-notification.service";
import { MatchingCacheService } from "./services/matching-cache.service";
// Enhanced services - these are the new improved versions
import { MatchingEnhancedController } from "./matching-enhanced.controller";
import { MatchingEnhancedService } from "./matching-enhanced.service";
import { MatchingCalculationEnhancedService } from "./services/matching-calculation-enhanced.service";
import { MatchingFilterEnhancedService } from "./services/matching-filter-enhanced.service";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, Preferences, User]),
    ConfigModule,
  ],
  controllers: [MatchingEnhancedController],
  providers: [
    // Support services
    MatchingMediaService,
    MatchingNotificationService,
    MatchingCacheService,
    // Enhanced services - main functionality
    MatchingEnhancedService,
    MatchingCalculationEnhancedService,
    MatchingFilterEnhancedService,
    S3Service,
  ],
  exports: [MatchingEnhancedService],
})
export class MatchingModule {}
