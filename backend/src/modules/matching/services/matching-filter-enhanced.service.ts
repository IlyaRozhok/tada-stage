import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Property } from "../../../entities/property.entity";
import { Preferences } from "../../../entities/preferences.entity";
import {
  MatchingCalculationEnhancedService,
  EnhancedMatchingScore,
} from "./matching-calculation-enhanced.service";

export interface EnhancedScoredProperty {
  property: Property;
  score: number;
  reasons: string[];
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
}

export interface MatchingFilters {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  propertyTypes?: string[];
  furnishing?: string;
  lifestyleFeatures?: string[];
  maxDistance?: number;
  commuteLocation?: string;
  maxCommuteTime?: number;
  availableFrom?: Date;
  availableTo?: Date;
  isBtr?: boolean;
  hasLatLng?: boolean;
}

@Injectable()
export class MatchingFilterEnhancedService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly matchingCalculationService: MatchingCalculationEnhancedService
  ) {}

  /**
   * Apply enhanced hard filters with database-level optimization
   */
  async applyEnhancedHardFilters(
    preferences: Preferences,
    limit: number = 100
  ): Promise<Property[]> {
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.operator", "operator")
      .leftJoinAndSelect("property.media", "media")
      .orderBy("property.created_at", "DESC");

    // Apply price filter
    if (preferences.min_price && preferences.max_price) {
      queryBuilder.andWhere("property.price BETWEEN :minPrice AND :maxPrice", {
        minPrice: preferences.min_price,
        maxPrice: preferences.max_price,
      });
    }

    // Apply bedroom filter
    if (preferences.min_bedrooms && preferences.max_bedrooms) {
      queryBuilder.andWhere(
        "property.bedrooms BETWEEN :minBedrooms AND :maxBedrooms",
        {
          minBedrooms: preferences.min_bedrooms,
          maxBedrooms: preferences.max_bedrooms,
        }
      );
    }

    // Apply property type filter
    if (preferences.property_type && preferences.property_type.length > 0) {
      queryBuilder.andWhere("property.property_type IN (:...propertyTypes)", {
        propertyTypes: preferences.property_type,
      });
    }

    // Apply furnishing filter
    if (preferences.furnishing && preferences.furnishing !== "any") {
      queryBuilder.andWhere("property.furnishing = :furnishing", {
        furnishing: preferences.furnishing,
      });
    }

    // Apply availability filter
    if (preferences.move_in_date) {
      queryBuilder.andWhere("property.available_from <= :moveInDate", {
        moveInDate: preferences.move_in_date,
      });
    }

    // Apply lifestyle features filter (at least one match required)
    if (
      preferences.lifestyle_features &&
      preferences.lifestyle_features.length > 0
    ) {
      const lifestyleConditions = preferences.lifestyle_features
        .map(
          (_, index) => `property.lifestyle_features LIKE :lifestyle${index}`
        )
        .join(" OR ");

      const lifestyleParams = preferences.lifestyle_features.reduce(
        (params, feature, index) => {
          params[`lifestyle${index}`] = `%${feature}%`;
          return params;
        },
        {}
      );

      queryBuilder.andWhere(`(${lifestyleConditions})`, lifestyleParams);
    }

    // Apply geographic filter if location preferences exist
    if (preferences.primary_postcode || preferences.secondary_location) {
      // Only include properties with coordinates for location-based matching
      queryBuilder.andWhere(
        "property.lat IS NOT NULL AND property.lng IS NOT NULL"
      );
    }

    // Limit results for performance
    queryBuilder.limit(limit);

    return await queryBuilder.getMany();
  }

  /**
   * Score and sort properties with enhanced algorithm
   */
  scoreAndSortPropertiesEnhanced(
    properties: Property[],
    preferences: Preferences,
    limit: number = 20
  ): EnhancedScoredProperty[] {
    // Score all properties
    const scoredProperties = properties.map((property) => {
      const matchScore =
        this.matchingCalculationService.calculateEnhancedMatchScore(
          property,
          preferences
        );

      return {
        property,
        score: matchScore.score,
        reasons: matchScore.reasons,
        perfectMatch: matchScore.perfectMatch,
        categoryScores: matchScore.categoryScores,
        weightedScore: matchScore.weightedScore,
      };
    });

    // Sort by weighted score (highest first), then by freshness
    scoredProperties.sort((a, b) => {
      // Primary sort: weighted score
      if (Math.abs(b.weightedScore - a.weightedScore) > 0.01) {
        return b.weightedScore - a.weightedScore;
      }

      // Secondary sort: freshness (newer properties first)
      const aFreshness = a.categoryScores.freshness;
      const bFreshness = b.categoryScores.freshness;
      if (bFreshness !== aFreshness) {
        return bFreshness - aFreshness;
      }

      // Tertiary sort: creation date
      return (
        new Date(b.property.created_at).getTime() -
        new Date(a.property.created_at).getTime()
      );
    });

    return scoredProperties.slice(0, limit);
  }

  /**
   * Get properties with perfect matches
   */
  getPerfectMatchesEnhanced(
    properties: Property[],
    preferences: Preferences
  ): Property[] {
    return properties.filter((property) => {
      const matchScore =
        this.matchingCalculationService.calculateEnhancedMatchScore(
          property,
          preferences
        );
      return matchScore.perfectMatch;
    });
  }

  /**
   * Get properties above a certain score threshold
   */
  getHighScoreMatchesEnhanced(
    properties: Property[],
    preferences: Preferences,
    threshold: number = 80
  ): EnhancedScoredProperty[] {
    const scoredProperties = properties.map((property) => {
      const matchScore =
        this.matchingCalculationService.calculateEnhancedMatchScore(
          property,
          preferences
        );

      return {
        property,
        score: matchScore.score,
        reasons: matchScore.reasons,
        perfectMatch: matchScore.perfectMatch,
        categoryScores: matchScore.categoryScores,
        weightedScore: matchScore.weightedScore,
      };
    });

    return scoredProperties
      .filter((scored) => scored.weightedScore >= threshold)
      .sort((a, b) => b.weightedScore - a.weightedScore);
  }

  /**
   * Apply custom filters to properties
   */
  applyCustomFilters(
    properties: Property[],
    filters: MatchingFilters
  ): Property[] {
    return properties.filter((property) => {
      // Price filter
      if (filters.minPrice && property.price < filters.minPrice) return false;
      if (filters.maxPrice && property.price > filters.maxPrice) return false;

      // Bedroom filter
      if (filters.minBedrooms && property.bedrooms < filters.minBedrooms)
        return false;
      if (filters.maxBedrooms && property.bedrooms > filters.maxBedrooms)
        return false;

      // Property type filter
      if (
        filters.propertyTypes &&
        !filters.propertyTypes.includes(property.property_type)
      ) {
        return false;
      }

      // Furnishing filter
      if (filters.furnishing && property.furnishing !== filters.furnishing)
        return false;

      // Lifestyle features filter
      if (filters.lifestyleFeatures && filters.lifestyleFeatures.length > 0) {
        const propertyFeatures = property.lifestyle_features || [];
        const hasRequiredFeatures = filters.lifestyleFeatures.every((feature) =>
          propertyFeatures.includes(feature)
        );
        if (!hasRequiredFeatures) return false;
      }

      // Availability filter
      if (
        filters.availableFrom &&
        property.available_from < filters.availableFrom
      )
        return false;
      if (filters.availableTo && property.available_from > filters.availableTo)
        return false;

      // BTR filter
      if (filters.isBtr !== undefined && property.is_btr !== filters.isBtr)
        return false;

      // Coordinate filter
      if (filters.hasLatLng && (!property.lat || !property.lng)) return false;

      return true;
    });
  }

  /**
   * Sort properties by different criteria
   */
  sortPropertiesEnhanced(
    properties: Property[],
    sortBy: "price" | "bedrooms" | "date" | "score" | "freshness" = "date",
    sortOrder: "asc" | "desc" = "desc"
  ): Property[] {
    const sortedProperties = [...properties];

    sortedProperties.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
          comparison = a.price - b.price;
          break;
        case "bedrooms":
          comparison = a.bedrooms - b.bedrooms;
          break;
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "freshness":
          const aDays = Math.ceil(
            (Date.now() - new Date(a.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const bDays = Math.ceil(
            (Date.now() - new Date(b.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          comparison = aDays - bDays;
          break;
        case "score":
          // This would require pre-calculated scores
          comparison = 0;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sortedProperties;
  }

  /**
   * Get property statistics for matching analysis
   */
  async getPropertyStatistics(): Promise<{
    totalProperties: number;
    propertiesWithCoordinates: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    bedroomDistribution: { [key: number]: number };
    propertyTypeDistribution: { [key: string]: number };
    furnishingDistribution: { [key: string]: number };
  }> {
    const properties = await this.propertyRepository.find();

    const propertiesWithCoordinates = properties.filter(
      (p) => p.lat && p.lng
    ).length;
    const prices = properties.map((p) => p.price);
    const averagePrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;

    const bedroomDistribution = properties.reduce((acc, p) => {
      acc[p.bedrooms] = (acc[p.bedrooms] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const propertyTypeDistribution = properties.reduce((acc, p) => {
      acc[p.property_type] = (acc[p.property_type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const furnishingDistribution = properties.reduce((acc, p) => {
      acc[p.furnishing] = (acc[p.furnishing] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalProperties: properties.length,
      propertiesWithCoordinates,
      averagePrice,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      bedroomDistribution,
      propertyTypeDistribution,
      furnishingDistribution,
    };
  }

  /**
   * Get matching insights for a user
   */
  async getMatchingInsights(
    userId: string,
    preferences: Preferences
  ): Promise<{
    totalCandidates: number;
    perfectMatches: number;
    highScoreMatches: number;
    averageScore: number;
    topCategories: string[];
    recommendations: string[];
  }> {
    const candidates = await this.applyEnhancedHardFilters(preferences, 200);
    const scoredProperties = this.scoreAndSortPropertiesEnhanced(
      candidates,
      preferences,
      200
    );

    const perfectMatches = scoredProperties.filter(
      (p) => p.perfectMatch
    ).length;
    const highScoreMatches = scoredProperties.filter(
      (p) => p.weightedScore >= 80
    ).length;
    const averageScore =
      scoredProperties.reduce((sum, p) => sum + p.weightedScore, 0) /
      scoredProperties.length;

    // Analyze top performing categories
    const categoryScores = scoredProperties.reduce((acc, p) => {
      Object.entries(p.categoryScores).forEach(([category, score]) => {
        acc[category] = (acc[category] || 0) + score;
      });
      return acc;
    }, {} as { [key: string]: number });

    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Generate recommendations
    const recommendations: string[] = [];
    if (perfectMatches === 0) {
      recommendations.push(
        "Consider expanding your price range or bedroom requirements"
      );
    }
    if (averageScore < 60) {
      recommendations.push(
        "Try adjusting your location preferences for better matches"
      );
    }
    if (scoredProperties.length < 10) {
      recommendations.push(
        "Consider being more flexible with your lifestyle feature requirements"
      );
    }

    return {
      totalCandidates: candidates.length,
      perfectMatches,
      highScoreMatches,
      averageScore: Math.round(averageScore * 100) / 100,
      topCategories,
      recommendations,
    };
  }
}

