import { Injectable } from "@nestjs/common";
import { Property } from "../../../entities/property.entity";
import { Preferences } from "../../../entities/preferences.entity";
import { MatchingCalculationService } from "./matching-calculation.service";

export interface ScoredProperty {
  property: Property;
  score: number;
  reasons: string[];
  perfectMatch: boolean;
}

@Injectable()
export class MatchingFilterService {
  constructor(
    private readonly matchingCalculationService: MatchingCalculationService
  ) {}

  /**
   * Apply critical hard filters to properties
   */
  applyHardFilters(
    properties: Property[],
    preferences: Preferences
  ): Property[] {
    let filteredProperties = properties;

    // Only apply price filter if both min and max are specified and reasonable
    if (
      preferences.min_price !== null &&
      preferences.min_price > 0 &&
      preferences.max_price !== null &&
      preferences.max_price > 0 &&
      preferences.min_price <= preferences.max_price
    ) {
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.price >= preferences.min_price! &&
          property.price <= preferences.max_price!
      );
    }

    return filteredProperties;
  }

  /**
   * Score and sort properties based on preferences
   */
  scoreAndSortProperties(
    properties: Property[],
    preferences: Preferences,
    limit: number = 20
  ): ScoredProperty[] {
    // Score all properties
    const scoredProperties = properties.map((property) => {
      const matchScore = this.matchingCalculationService.calculateMatchScore(
        property,
        preferences
      );

      return {
        property,
        score: matchScore.score,
        reasons: matchScore.reasons,
        perfectMatch: matchScore.perfectMatch,
      };
    });

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

    return scoredProperties.slice(0, limit);
  }

  /**
   * Filter properties by specific criteria
   */
  filterByCriteria(
    properties: Property[],
    criteria: {
      minPrice?: number;
      maxPrice?: number;
      minBedrooms?: number;
      maxBedrooms?: number;
      propertyType?: string;
      furnishing?: string;
      lifestyleFeatures?: string[];
    }
  ): Property[] {
    return properties.filter((property) => {
      // Price filter
      if (criteria.minPrice && property.price < criteria.minPrice) {
        return false;
      }
      if (criteria.maxPrice && property.price > criteria.maxPrice) {
        return false;
      }

      // Bedrooms filter
      if (criteria.minBedrooms && property.bedrooms < criteria.minBedrooms) {
        return false;
      }
      if (criteria.maxBedrooms && property.bedrooms > criteria.maxBedrooms) {
        return false;
      }

      // Property type filter
      if (
        criteria.propertyType &&
        property.property_type !== criteria.propertyType
      ) {
        return false;
      }

      // Furnishing filter
      if (criteria.furnishing && property.furnishing !== criteria.furnishing) {
        return false;
      }

      // Lifestyle features filter
      if (criteria.lifestyleFeatures && criteria.lifestyleFeatures.length > 0) {
        const propertyFeatures = property.lifestyle_features || [];
        const hasRequiredFeatures = criteria.lifestyleFeatures.every(
          (feature) => propertyFeatures.includes(feature)
        );
        if (!hasRequiredFeatures) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort properties by different criteria
   */
  sortProperties(
    properties: Property[],
    sortBy: "price" | "bedrooms" | "date" | "score" = "date",
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
   * Get properties with perfect matches
   */
  getPerfectMatches(
    properties: Property[],
    preferences: Preferences
  ): Property[] {
    return properties.filter((property) =>
      this.matchingCalculationService.isPerfectMatch(property, preferences)
    );
  }

  /**
   * Get properties above a certain score threshold
   */
  getHighScoreMatches(
    properties: Property[],
    preferences: Preferences,
    threshold: number = 80
  ): ScoredProperty[] {
    const scoredProperties = properties.map((property) => {
      const matchScore = this.matchingCalculationService.calculateMatchScore(
        property,
        preferences
      );

      return {
        property,
        score: matchScore.score,
        reasons: matchScore.reasons,
        perfectMatch: matchScore.perfectMatch,
      };
    });

    return scoredProperties.filter((scored) => scored.score >= threshold);
  }
}
