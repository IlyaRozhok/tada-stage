import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

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
    private readonly s3Service: S3Service
  ) {}

  /**
   * Update presigned URLs for property media
   */
  private async updateMediaPresignedUrls(
    property: Property
  ): Promise<Property> {
    if (property.media && property.media.length > 0) {
      for (const media of property.media) {
        try {
          media.url = await this.s3Service.getPresignedUrl(media.s3_key);
        } catch (error) {
          console.error(
            "Error generating presigned URL for media:",
            media.id,
            error
          );
          // Fallback to S3 direct URL
          media.url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${media.s3_key}`;
        }
      }
    }
    return property;
  }

  /**
   * Update presigned URLs for multiple properties
   */
  private async updateMultiplePropertiesMediaUrls(
    properties: Property[]
  ): Promise<Property[]> {
    for (const property of properties) {
      await this.updateMediaPresignedUrls(property);
    }
    return properties;
  }

  /**
   * Find properties that match user preferences with flexible scoring:
   * - No hard filters (except critical ones like price if specified)
   * - All properties are considered, scored based on preference matches
   * - Null/any values are ignored in scoring
   */
  async findMatchedProperties(
    userId: string,
    limit: number = 20
  ): Promise<Property[]> {
    console.log(`🔍 Finding matched properties for user: ${userId}, limit: ${limit}`);
    
    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    console.log(`📋 User preferences found:`, preferences ? 'Yes' : 'No');
    if (preferences) {
      console.log(`📋 Preferences details:`, {
        price_range: `${preferences.min_price}-${preferences.max_price}`,
        bedrooms: `${preferences.min_bedrooms}-${preferences.max_bedrooms}`,
        property_type: preferences.property_type,
        furnishing: preferences.furnishing,
        lifestyle_features: preferences.lifestyle_features?.length || 0
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
      console.log(`⚠️ No preferences set, returning ${Math.min(limit, allProperties.length)} properties by date`);
      const propertiesWithUrls = await this.updateMultiplePropertiesMediaUrls(allProperties.slice(0, limit));
      return propertiesWithUrls;
    }

    // Apply only critical hard filters (price range if both min and max specified)
    let candidateProperties = allProperties;

    // Only apply price filter if both min and max are specified and reasonable
    if (
      preferences.min_price !== null &&
      preferences.min_price > 0 &&
      preferences.max_price !== null &&
      preferences.max_price > 0 &&
      preferences.min_price <= preferences.max_price
    ) {
      candidateProperties = candidateProperties.filter(
        (property) =>
          property.price >= preferences.min_price! &&
          property.price <= preferences.max_price!
      );
    }

    // Score and sort all candidate properties
    const scoredProperties = candidateProperties.map((property) => ({
      property,
      score: this.calculateMatchScore(property, preferences),
    }));

    // Sort by score (highest first), then by date (newest first)
    scoredProperties.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (
        new Date(b.property.created_at).getTime() -
        new Date(a.property.created_at).getTime()
      );
    });

    const matchedProperties = scoredProperties
      .slice(0, limit)
      .map((scored) => scored.property);

    console.log(`✅ Returning ${matchedProperties.length} matched properties`);
    if (scoredProperties.length > 0) {
      console.log(`📊 Top 3 match scores:`, scoredProperties.slice(0, 3).map(s => ({
        property_id: s.property.id,
        score: Math.round(s.score * 100) / 100,
        price: s.property.price,
        bedrooms: s.property.bedrooms,
        type: s.property.property_type
      })));
    }

    // Update presigned URLs for media files
    return await this.updateMultiplePropertiesMediaUrls(matchedProperties);
  }

  /**
   * Calculate match score with dynamic weights based on user preferences
   * Only considers criteria where user has actual preferences (not null/any)
   */
  private calculateMatchScore(
    property: Property,
    preferences: Preferences
  ): number {
    const scores: { [key: string]: number } = {};
    const baseWeights = {
      price: 25,
      bedrooms: 20,
      property_type: 20,
      furnishing: 15,
      lifestyle_features: 20,
    };

    // Price match
    if (
      preferences.min_price !== null &&
      preferences.min_price > 0 &&
      preferences.max_price !== null &&
      preferences.max_price > 0
    ) {
      const priceRange = preferences.max_price - preferences.min_price;
      if (priceRange > 0) {
        const idealPrice = preferences.min_price + priceRange * 0.3; // Prefer lower end
        const priceDiff = Math.abs(property.price - idealPrice);
        scores.price = Math.max(0, 100 - (priceDiff / priceRange) * 100);
      } else {
        // Single price point
        scores.price = property.price === preferences.min_price ? 100 : 0;
      }
    }

    // Bedroom match
    if (
      (preferences.min_bedrooms !== null && preferences.min_bedrooms > 0) ||
      (preferences.max_bedrooms !== null && preferences.max_bedrooms > 0)
    ) {
      let bedroomScore = 0;

      // Check if property meets minimum requirement
      if (preferences.min_bedrooms !== null && preferences.min_bedrooms > 0) {
        if (property.bedrooms >= preferences.min_bedrooms) {
          bedroomScore = 60; // Base match score

          // Bonus for exact minimum match
          if (property.bedrooms === preferences.min_bedrooms) {
            bedroomScore = 100;
          }
        }
      } else {
        bedroomScore = 50; // Neutral score if no minimum specified
      }

      // Check if property meets maximum requirement
      if (preferences.max_bedrooms !== null && preferences.max_bedrooms > 0) {
        if (property.bedrooms <= preferences.max_bedrooms) {
          if (bedroomScore > 0) {
            bedroomScore = 100; // Perfect range match
          } else {
            bedroomScore = 60; // Meets max but not min
          }
        } else {
          bedroomScore = Math.max(0, bedroomScore - 30); // Penalty for exceeding max
        }
      }

      scores.bedrooms = bedroomScore;
    }

    // Property type match
    if (
      preferences.property_type &&
      preferences.property_type.length > 0 &&
      !preferences.property_type.includes("any")
    ) {
      scores.property_type = preferences.property_type
        .map((type) => type.toLowerCase())
        .includes(property.property_type.toLowerCase())
        ? 100
        : 0;
    }

    // Furnishing match
    if (preferences.furnishing && preferences.furnishing !== "any") {
      scores.furnishing =
        property.furnishing.toLowerCase() ===
        preferences.furnishing.toLowerCase()
          ? 100
          : 0;
    }

    // Lifestyle features match
    const lifestyleScore = this.calculateLifestyleFeaturesScore(
      property,
      preferences
    );
    if (lifestyleScore !== null) {
      scores.lifestyle_features = lifestyleScore;
    }

    // Calculate final score with dynamic weights
    const activeScores = Object.keys(scores);
    if (activeScores.length === 0) {
      return 0; // No preferences to match
    }

    // Calculate total weight of active criteria
    const totalWeight = activeScores.reduce(
      (sum, key) => sum + baseWeights[key],
      0
    );

    // Calculate weighted score
    const weightedScore = activeScores.reduce((sum, key) => {
      const weight = baseWeights[key] / totalWeight; // Normalize weight
      return sum + scores[key] * weight;
    }, 0);

    return Math.min(100, Math.max(0, weightedScore));
  }

  /**
   * Calculate lifestyle features matching score
   * Returns null if user has no lifestyle preferences
   */
  private calculateLifestyleFeaturesScore(
    property: Property,
    preferences: Preferences
  ): number | null {
    // Collect all user lifestyle preferences
    const userFeatures = new Set<string>();

    if (preferences.lifestyle_features) {
      preferences.lifestyle_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.social_features) {
      preferences.social_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.work_features) {
      preferences.work_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.convenience_features) {
      preferences.convenience_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.pet_friendly_features) {
      preferences.pet_friendly_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.luxury_features) {
      preferences.luxury_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }

    // If user has no lifestyle preferences, return null (don't consider this criteria)
    if (userFeatures.size === 0) {
      return null;
    }

    // If property has no lifestyle features, return 0 (preference not met)
    if (
      !property.lifestyle_features ||
      property.lifestyle_features.length === 0
    ) {
      return 0;
    }

    // Count matching features
    const propertyFeatures = property.lifestyle_features.map((f) =>
      f.toLowerCase()
    );
    const matchingFeatures = propertyFeatures.filter((feature) =>
      userFeatures.has(feature)
    );

    // Calculate score based on percentage of user preferences matched
    const matchPercentage = matchingFeatures.length / userFeatures.size;
    return matchPercentage * 100;
  }

  /**
   * Get detailed matching results with scores and reasons
   */
  async getDetailedMatches(
    userId: string,
    limit: number = 10
  ): Promise<MatchingResult[]> {
    console.log(`🔍 Getting detailed matches for user: ${userId}, limit: ${limit}`);
    
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      console.log(`⚠️ No preferences found, returning properties without scores`);
      const properties = await this.propertyRepository.find({
        relations: ["operator", "media"],
        order: { created_at: "DESC" },
        take: limit,
      });

      // Update presigned URLs for media files
      const propertiesWithUrls =
        await this.updateMultiplePropertiesMediaUrls(properties);

      const result = propertiesWithUrls.map((property) => ({
        property,
        matchScore: 0,
        matchReasons: ["No preferences set"],
        perfectMatch: false,
      }));
      
      console.log(`✅ Returning ${result.length} properties without preferences`);
      return result;
    }

    const properties = await this.findMatchedProperties(userId, limit * 2); // Get more to score them

    const result = properties.slice(0, limit).map((property) => {
      const score = this.calculateMatchScore(property, preferences);
      const reasons = this.getMatchReasons(property, preferences);
      const perfectMatch = this.isPerfectMatch(property, preferences);

      return {
        property,
        matchScore: Math.round(score),
        matchReasons: reasons,
        perfectMatch,
      };
    });
    
    console.log(`✅ Returning ${result.length} detailed matches with scores`);
    return result;
  }

  /**
   * Get human-readable match reasons
   */
  private getMatchReasons(
    property: Property,
    preferences: Preferences
  ): string[] {
    const reasons: string[] = [];

    // Price match
    if (preferences.min_price && preferences.max_price) {
      if (
        property.price >= preferences.min_price &&
        property.price <= preferences.max_price
      ) {
        reasons.push(
          `Price £${property.price} within budget £${preferences.min_price}-£${preferences.max_price}`
        );
      }
    }

    // Bedroom match
    if (
      preferences.min_bedrooms &&
      property.bedrooms >= preferences.min_bedrooms
    ) {
      reasons.push(
        `${property.bedrooms} bedrooms meets requirement (${preferences.min_bedrooms}+ needed)`
      );
    }

    // Property type match
    if (
      preferences.property_type &&
      preferences.property_type.length > 0 &&
      !preferences.property_type.includes("any") &&
      preferences.property_type
        .map((type) => type.toLowerCase())
        .includes(property.property_type.toLowerCase())
    ) {
      reasons.push(
        `Property type "${property.property_type}" matches preference`
      );
    }

    // Furnishing match
    if (
      preferences.furnishing &&
      preferences.furnishing !== "any" &&
      property.furnishing.toLowerCase() === preferences.furnishing.toLowerCase()
    ) {
      reasons.push(`${property.furnishing} furnishing matches preference`);
    }

    // Lifestyle features
    const matchingFeatures = this.getMatchingLifestyleFeatures(
      property,
      preferences
    );
    if (matchingFeatures.length > 0) {
      reasons.push(
        `${matchingFeatures.length} matching lifestyle features: ${matchingFeatures.slice(0, 3).join(", ")}${matchingFeatures.length > 3 ? "..." : ""}`
      );
    }

    return reasons;
  }

  /**
   * Get matching lifestyle features
   */
  private getMatchingLifestyleFeatures(
    property: Property,
    preferences: Preferences
  ): string[] {
    if (
      !property.lifestyle_features ||
      property.lifestyle_features.length === 0
    ) {
      return [];
    }

    // Collect all user lifestyle preferences
    const userFeatures = new Set<string>();

    if (preferences.lifestyle_features) {
      preferences.lifestyle_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.social_features) {
      preferences.social_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.work_features) {
      preferences.work_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.convenience_features) {
      preferences.convenience_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.pet_friendly_features) {
      preferences.pet_friendly_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.luxury_features) {
      preferences.luxury_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }

    // Find matching features
    const propertyFeatures = property.lifestyle_features.map((f) =>
      f.toLowerCase()
    );
    return propertyFeatures.filter((feature) => userFeatures.has(feature));
  }

  /**
   * Determine if property is a perfect match for user preferences
   * Perfect match means all specified preferences are met
   */
  private isPerfectMatch(
    property: Property,
    preferences: Preferences
  ): boolean {
    // Check price range
    if (
      preferences.min_price !== null &&
      preferences.min_price > 0 &&
      preferences.max_price !== null &&
      preferences.max_price > 0
    ) {
      if (
        property.price < preferences.min_price ||
        property.price > preferences.max_price
      ) {
        return false;
      }
    }

    // Check bedroom requirements
    if (preferences.min_bedrooms !== null && preferences.min_bedrooms > 0) {
      if (property.bedrooms < preferences.min_bedrooms) {
        return false;
      }
    }
    if (preferences.max_bedrooms !== null && preferences.max_bedrooms > 0) {
      if (property.bedrooms > preferences.max_bedrooms) {
        return false;
      }
    }

    // Check property type
    if (
      preferences.property_type &&
      preferences.property_type.length > 0 &&
      !preferences.property_type.includes("any")
    ) {
      if (
        !preferences.property_type
          .map((type) => type.toLowerCase())
          .includes(property.property_type.toLowerCase())
      ) {
        return false;
      }
    }

    // Check furnishing
    if (preferences.furnishing && preferences.furnishing !== "any") {
      if (
        property.furnishing.toLowerCase() !==
        preferences.furnishing.toLowerCase()
      ) {
        return false;
      }
    }

    // Check lifestyle features - must have at least one match if user has preferences
    const userFeatures = new Set<string>();

    if (preferences.lifestyle_features) {
      preferences.lifestyle_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.social_features) {
      preferences.social_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.work_features) {
      preferences.work_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.convenience_features) {
      preferences.convenience_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.pet_friendly_features) {
      preferences.pet_friendly_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.luxury_features) {
      preferences.luxury_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }

    // If user has lifestyle preferences, property must have at least one match
    if (userFeatures.size > 0) {
      if (
        !property.lifestyle_features ||
        property.lifestyle_features.length === 0
      ) {
        return false;
      }

      const propertyFeatures = property.lifestyle_features.map((f) =>
        f.toLowerCase()
      );
      const hasMatch = propertyFeatures.some((feature) =>
        userFeatures.has(feature)
      );

      if (!hasMatch) {
        return false;
      }
    }

    return true;
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
