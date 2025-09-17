import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import {
  MatchingCalculationEnhancedService,
  EnhancedMatchingScore,
} from "./services/matching-calculation-enhanced.service";
import {
  MatchingFilterEnhancedService,
  EnhancedScoredProperty,
} from "./services/matching-filter-enhanced.service";
import { MatchingMediaService } from "./services/matching-media.service";
import { MatchingNotificationService } from "./services/matching-notification.service";
import { MatchingCacheService } from "./services/matching-cache.service";

export interface EnhancedMatchingResult {
  property: Property;
  matchScore: number;
  matchReasons: string[];
  perfectMatch: boolean;
  categoryScores: {
    price: number;
    location: number;
    property: number;
    lifestyle: number;
    availability: number;
    freshness: number;
  };
  weightedScore: number;
  insights?: {
    totalCandidates: number;
    perfectMatches: number;
    highScoreMatches: number;
    averageScore: number;
    topCategories: string[];
    recommendations: string[];
  };
}

@Injectable()
export class MatchingEnhancedService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Preferences)
    private readonly preferencesRepository: Repository<Preferences>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly matchingCalculationService: MatchingCalculationEnhancedService,
    private readonly matchingFilterService: MatchingFilterEnhancedService,
    private readonly matchingMediaService: MatchingMediaService,
    private readonly matchingNotificationService: MatchingNotificationService,
    private readonly matchingCacheService: MatchingCacheService
  ) {}

  /**
   * Generate matches for a property (compatibility method)
   */
  async generateMatches(propertyId: string): Promise<void> {
    console.log(`🔄 Generating matches for property: ${propertyId}`);
    // This method can be implemented to pre-generate matches for a property
    // For now, we'll just log that matches are being generated
    // In a production system, this might update a matches table or cache
  }

  /**
   * Find matched properties (compatibility method)
   */
  async findMatchedProperties(
    userId: string,
    limit: number = 20
  ): Promise<Property[]> {
    return this.findEnhancedMatchedProperties(userId, limit, false);
  }

  /**
   * Find enhanced matched properties with advanced algorithms
   */
  async findEnhancedMatchedProperties(
    userId: string,
    limit: number = 20,
    includeInsights: boolean = false
  ): Promise<Property[]> {
    console.log(
      `🔍 Finding enhanced matched properties for user: ${userId}, limit: ${limit}`
    );

    // Check cache first
    const cacheKey = this.matchingCacheService.getUserMatchesKey(userId, limit);
    const cachedResult = this.matchingCacheService.get<Property[]>(cacheKey);

    if (cachedResult) {
      console.log(`📦 Returning cached enhanced results for user ${userId}`);
      return cachedResult;
    }

    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    console.log(`📋 User preferences found:`, preferences ? "Yes" : "No");
    if (preferences) {
      console.log(`📋 Enhanced preferences details:`, {
        price_range: `${preferences.min_price}-${preferences.max_price}`,
        bedrooms: `${preferences.min_bedrooms}-${preferences.max_bedrooms}`,
        property_type: preferences.property_type,
        furnishing: preferences.furnishing,
        lifestyle_features: preferences.lifestyle_features?.length || 0,
        location:
          preferences.primary_postcode || preferences.secondary_location,
        commute: preferences.commute_location,
      });
    }

    let matchedProperties: Property[];

    if (!preferences) {
      // If no preferences set, return properties by date with enhanced sorting
      console.log(
        `⚠️ No preferences set, returning ${Math.min(
          limit,
          50
        )} properties by freshness`
      );
      const allProperties = await this.propertyRepository.find({
        relations: ["operator", "media"],
        order: { created_at: "DESC" },
        take: limit,
      });
      matchedProperties = allProperties;
    } else {
      // Apply enhanced hard filters with database optimization
      const candidateProperties =
        await this.matchingFilterService.applyEnhancedHardFilters(
          preferences,
          100 // Get more candidates for better scoring
        );

      console.log(
        `🏠 Enhanced filtered candidates: ${candidateProperties.length}`
      );

      // Score and sort properties with enhanced algorithm
      const scoredProperties =
        this.matchingFilterService.scoreAndSortPropertiesEnhanced(
          candidateProperties,
          preferences,
          limit
        );

      matchedProperties = scoredProperties.map((scored) => scored.property);

      console.log(
        `✅ Returning ${matchedProperties.length} enhanced matched properties`
      );
      if (scoredProperties.length > 0) {
        console.log(
          `📊 Top 3 enhanced match scores:`,
          scoredProperties.slice(0, 3).map((s) => ({
            property_id: s.property.id,
            weighted_score: Math.round(s.weightedScore * 100) / 100,
            category_scores: {
              price: Math.round(s.categoryScores.price),
              location: Math.round(s.categoryScores.location),
              property: Math.round(s.categoryScores.property),
              lifestyle: Math.round(s.categoryScores.lifestyle),
            },
            price: s.property.price,
            bedrooms: s.property.bedrooms,
            type: s.property.property_type,
          }))
        );
      }
    }

    // Update presigned URLs for media files
    const propertiesWithUrls =
      await this.matchingMediaService.updateMultiplePropertiesMediaUrls(
        matchedProperties
      );

    // Cache the result
    this.matchingCacheService.set(cacheKey, propertiesWithUrls);

    return propertiesWithUrls;
  }

  /**
   * Get detailed enhanced matches with scores and reasons
   */
  async getDetailedEnhancedMatches(
    userId: string,
    limit: number = 20,
    includeInsights: boolean = false
  ): Promise<EnhancedMatchingResult[]> {
    console.log(`🔍 Getting detailed enhanced matches for user: ${userId}`);

    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      console.log("⚠️ No preferences found, returning empty results");
      return [];
    }

    // Apply enhanced hard filters
    const candidateProperties =
      await this.matchingFilterService.applyEnhancedHardFilters(
        preferences,
        100
      );

    // Score and sort properties
    const scoredProperties =
      this.matchingFilterService.scoreAndSortPropertiesEnhanced(
        candidateProperties,
        preferences,
        limit
      );

    // Convert to EnhancedMatchingResult format
    const results: EnhancedMatchingResult[] = scoredProperties.map(
      (scored) => ({
        property: scored.property,
        matchScore: scored.score,
        matchReasons: scored.reasons,
        perfectMatch: scored.perfectMatch,
        categoryScores: scored.categoryScores,
        weightedScore: scored.weightedScore,
      })
    );

    // Add insights if requested
    if (includeInsights) {
      const insights = await this.matchingFilterService.getMatchingInsights(
        userId,
        preferences
      );
      results.forEach((result) => {
        result.insights = insights;
      });
    }

    console.log(`✅ Returning ${results.length} detailed enhanced matches`);
    return results;
  }

  /**
   * Get perfect matches with enhanced algorithm
   */
  async getPerfectEnhancedMatches(userId: string): Promise<Property[]> {
    console.log(`🔍 Getting perfect enhanced matches for user: ${userId}`);

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      return [];
    }

    const candidateProperties =
      await this.matchingFilterService.applyEnhancedHardFilters(
        preferences,
        50
      );

    const perfectMatches = this.matchingFilterService.getPerfectMatchesEnhanced(
      candidateProperties,
      preferences
    );

    console.log(`✅ Found ${perfectMatches.length} perfect enhanced matches`);
    return await this.matchingMediaService.updateMultiplePropertiesMediaUrls(
      perfectMatches
    );
  }

  /**
   * Get high-score matches above threshold with enhanced algorithm
   */
  async getHighScoreEnhancedMatches(
    userId: string,
    threshold: number = 80,
    limit: number = 20
  ): Promise<EnhancedMatchingResult[]> {
    console.log(
      `🔍 Getting high-score enhanced matches for user: ${userId}, threshold: ${threshold}`
    );

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      return [];
    }

    const candidateProperties =
      await this.matchingFilterService.applyEnhancedHardFilters(
        preferences,
        100
      );

    const highScoreMatches =
      this.matchingFilterService.getHighScoreMatchesEnhanced(
        candidateProperties,
        preferences,
        threshold
      );

    const results: EnhancedMatchingResult[] = highScoreMatches
      .slice(0, limit)
      .map((scored) => ({
        property: scored.property,
        matchScore: scored.score,
        matchReasons: scored.reasons,
        perfectMatch: scored.perfectMatch,
        categoryScores: scored.categoryScores,
        weightedScore: scored.weightedScore,
      }));

    console.log(`✅ Found ${results.length} high-score enhanced matches`);
    return results;
  }

  /**
   * Generate enhanced matches for a specific property against all tenants
   */
  async generateEnhancedMatches(propertyId: string): Promise<void> {
    console.log(`🔄 Generating enhanced matches for property ${propertyId}`);

    // Get the property
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      relations: ["operator", "media"],
    });

    if (!property) {
      console.log(`❌ Property ${propertyId} not found`);
      return;
    }

    // Get all tenant preferences
    const allPreferences = await this.preferencesRepository.find({
      relations: ["user"],
    });

    console.log(
      `👥 Found ${allPreferences.length} tenant preferences to check`
    );

    const notifications: Array<{
      userId: string;
      property: Property;
      matchScore: number;
      reasons: string[];
      type: "perfect" | "high-score";
      categoryScores: any;
    }> = [];

    // Check matches for each tenant
    for (const preferences of allPreferences) {
      if (!preferences.user || preferences.user.role !== "tenant") {
        continue;
      }

      // Apply enhanced hard filters
      const candidateProperties =
        await this.matchingFilterService.applyEnhancedHardFilters(
          preferences,
          1
        );

      if (candidateProperties.length === 0) {
        continue;
      }

      // Calculate enhanced match score
      const matchScore =
        this.matchingCalculationService.calculateEnhancedMatchScore(
          property,
          preferences
        );

      // Check if it's a perfect match or high-score match
      if (matchScore.perfectMatch) {
        notifications.push({
          userId: preferences.user_id,
          property,
          matchScore: matchScore.score,
          reasons: matchScore.reasons,
          type: "perfect",
          categoryScores: matchScore.categoryScores,
        });
      } else if (matchScore.score >= 80) {
        notifications.push({
          userId: preferences.user_id,
          property,
          matchScore: matchScore.score,
          reasons: matchScore.reasons,
          type: "high-score",
          categoryScores: matchScore.categoryScores,
        });
      }
    }

    // Send notifications
    if (notifications.length > 0) {
      await this.matchingNotificationService.batchNotifyMatches(notifications);
      console.log(
        `📬 Sent ${notifications.length} enhanced match notifications`
      );
    }

    // Invalidate cache for affected users
    const affectedUserIds = notifications.map((n) => n.userId);
    affectedUserIds.forEach((userId) => {
      this.matchingCacheService.invalidateUserCache(userId);
    });

    // Invalidate property cache
    this.matchingCacheService.invalidatePropertyCache(propertyId);

    console.log(`✅ Generated enhanced matches for property ${propertyId}`);
  }

  /**
   * Get matching insights and analytics
   */
  async getMatchingInsights(userId: string): Promise<{
    totalCandidates: number;
    perfectMatches: number;
    highScoreMatches: number;
    averageScore: number;
    topCategories: string[];
    recommendations: string[];
    propertyStatistics: any;
  }> {
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      return {
        totalCandidates: 0,
        perfectMatches: 0,
        highScoreMatches: 0,
        averageScore: 0,
        topCategories: [],
        recommendations: [
          "Please set your preferences to get matching insights",
        ],
        propertyStatistics: {},
      };
    }

    const insights = await this.matchingFilterService.getMatchingInsights(
      userId,
      preferences
    );
    const propertyStatistics =
      await this.matchingFilterService.getPropertyStatistics();

    return {
      ...insights,
      propertyStatistics,
    };
  }

  /**
   * Get personalized recommendations based on user behavior
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<EnhancedMatchingResult[]> {
    console.log(`🎯 Getting personalized recommendations for user: ${userId}`);

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      return [];
    }

    // Get more candidates for personalized scoring
    const candidateProperties =
      await this.matchingFilterService.applyEnhancedHardFilters(
        preferences,
        200
      );

    // Apply personalized scoring (could include user behavior data in the future)
    const scoredProperties =
      this.matchingFilterService.scoreAndSortPropertiesEnhanced(
        candidateProperties,
        preferences,
        limit
      );

    const results: EnhancedMatchingResult[] = scoredProperties.map(
      (scored) => ({
        property: scored.property,
        matchScore: scored.score,
        matchReasons: scored.reasons,
        perfectMatch: scored.perfectMatch,
        categoryScores: scored.categoryScores,
        weightedScore: scored.weightedScore,
      })
    );

    console.log(`✅ Returning ${results.length} personalized recommendations`);
    return results;
  }
}
