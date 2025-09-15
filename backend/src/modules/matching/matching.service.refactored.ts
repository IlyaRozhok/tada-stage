import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { MatchingFilterService } from "./services/matching-filter.service";
import { MatchingMediaService } from "./services/matching-media.service";

export interface MatchingResult {
  property: Property;
  matchScore: number;
  matchReasons: string[];
  perfectMatch: boolean;
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Preferences)
    private readonly preferencesRepository: Repository<Preferences>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly matchingCalculationService: MatchingCalculationService,
    private readonly matchingFilterService: MatchingFilterService,
    private readonly matchingMediaService: MatchingMediaService
  ) {}

  /**
   * Find properties that match user preferences with flexible scoring
   */
  async findMatchedProperties(
    userId: string,
    limit: number = 20
  ): Promise<Property[]> {
    console.log(
      `🔍 Finding matched properties for user: ${userId}, limit: ${limit}`
    );

    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    console.log(`📋 User preferences found:`, preferences ? "Yes" : "No");
    if (preferences) {
      console.log(`📋 Preferences details:`, {
        price_range: `${preferences.min_price}-${preferences.max_price}`,
        bedrooms: `${preferences.min_bedrooms}-${preferences.max_bedrooms}`,
        property_type: preferences.property_type,
        furnishing: preferences.furnishing,
        lifestyle_features: preferences.lifestyle_features?.length || 0,
      });
    }

    // Get all properties
    const allProperties = await this.propertyRepository.find({
      relations: ["operator", "media"],
      order: { created_at: "DESC" },
    });

    console.log(`🏠 Total properties available: ${allProperties.length}`);

    if (!preferences) {
      // If no preferences set, return properties by date
      console.log(
        `⚠️ No preferences set, returning ${Math.min(
          limit,
          allProperties.length
        )} properties by date`
      );
      const propertiesWithUrls =
        await this.matchingMediaService.updateMultiplePropertiesMediaUrls(
          allProperties.slice(0, limit)
        );
      return propertiesWithUrls;
    }

    // Apply hard filters
    const candidateProperties = this.matchingFilterService.applyHardFilters(
      allProperties,
      preferences
    );

    // Score and sort properties
    const scoredProperties = this.matchingFilterService.scoreAndSortProperties(
      candidateProperties,
      preferences,
      limit
    );

    const matchedProperties = scoredProperties.map((scored) => scored.property);

    console.log(`✅ Returning ${matchedProperties.length} matched properties`);
    if (scoredProperties.length > 0) {
      console.log(
        `📊 Top 3 match scores:`,
        scoredProperties.slice(0, 3).map((s) => ({
          property_id: s.property.id,
          score: Math.round(s.score * 100) / 100,
          price: s.property.price,
          bedrooms: s.property.bedrooms,
          type: s.property.property_type,
        }))
      );
    }

    // Update presigned URLs for media files
    return await this.matchingMediaService.updateMultiplePropertiesMediaUrls(
      matchedProperties
    );
  }

  /**
   * Get detailed matches with scores and reasons
   */
  async getDetailedMatches(
    userId: string,
    limit: number = 20
  ): Promise<MatchingResult[]> {
    console.log(`🔍 Getting detailed matches for user: ${userId}`);

    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      console.log("⚠️ No preferences found, returning empty results");
      return [];
    }

    // Get all properties
    const allProperties = await this.propertyRepository.find({
      relations: ["operator", "media"],
      order: { created_at: "DESC" },
    });

    // Apply hard filters
    const candidateProperties = this.matchingFilterService.applyHardFilters(
      allProperties,
      preferences
    );

    // Score and sort properties
    const scoredProperties = this.matchingFilterService.scoreAndSortProperties(
      candidateProperties,
      preferences,
      limit
    );

    // Convert to MatchingResult format
    const results: MatchingResult[] = scoredProperties.map((scored) => ({
      property: scored.property,
      matchScore: scored.score,
      matchReasons: scored.reasons,
      perfectMatch: scored.perfectMatch,
    }));

    console.log(`✅ Returning ${results.length} detailed matches`);
    return results;
  }

  /**
   * Get perfect matches only
   */
  async getPerfectMatches(userId: string): Promise<Property[]> {
    console.log(`🔍 Getting perfect matches for user: ${userId}`);

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      return [];
    }

    const allProperties = await this.propertyRepository.find({
      relations: ["operator", "media"],
    });

    const perfectMatches = this.matchingFilterService.getPerfectMatches(
      allProperties,
      preferences
    );

    console.log(`✅ Found ${perfectMatches.length} perfect matches`);
    return await this.matchingMediaService.updateMultiplePropertiesMediaUrls(
      perfectMatches
    );
  }

  /**
   * Get high-score matches above threshold
   */
  async getHighScoreMatches(
    userId: string,
    threshold: number = 80,
    limit: number = 20
  ): Promise<MatchingResult[]> {
    console.log(
      `🔍 Getting high-score matches for user: ${userId}, threshold: ${threshold}`
    );

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      return [];
    }

    const allProperties = await this.propertyRepository.find({
      relations: ["operator", "media"],
    });

    const highScoreMatches = this.matchingFilterService.getHighScoreMatches(
      allProperties,
      preferences,
      threshold
    );

    const results: MatchingResult[] = highScoreMatches
      .slice(0, limit)
      .map((scored) => ({
        property: scored.property,
        matchScore: scored.score,
        matchReasons: scored.reasons,
        perfectMatch: scored.perfectMatch,
      }));

    console.log(`✅ Found ${results.length} high-score matches`);
    return results;
  }

  /**
   * Generate matches for a specific property against all tenants
   * This is called when a property is created or updated to ensure fresh matches
   */
  async generateMatches(propertyId: string): Promise<void> {
    // This method can be used to trigger matching calculations
    // For now, it's a placeholder since matching is calculated on-demand
    // In the future, this could:
    // 1. Pre-calculate and store matches in a cache/database
    // 2. Send notifications to matching tenants
    // 3. Update search indexes

    console.log(`Generated matches for property ${propertyId}`);
  }
}
