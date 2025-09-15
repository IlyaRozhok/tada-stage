import { Injectable } from "@nestjs/common";
import { Property } from "../../../entities/property.entity";
import { Preferences } from "../../../entities/preferences.entity";

export interface MatchingScore {
  score: number;
  reasons: string[];
  perfectMatch: boolean;
}

@Injectable()
export class MatchingCalculationService {
  /**
   * Calculate match score with dynamic weights based on user preferences
   * Only considers criteria where user has actual preferences (not null/any)
   */
  calculateMatchScore(
    property: Property,
    preferences: Preferences
  ): MatchingScore {
    const scores: { [key: string]: number } = {};
    const reasons: string[] = [];
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

        if (scores.price > 80) {
          reasons.push("Price within your preferred range");
        }
      } else {
        // Single price point
        const priceDiff = Math.abs(property.price - preferences.min_price);
        scores.price = Math.max(
          0,
          100 - (priceDiff / preferences.min_price) * 50
        );

        if (scores.price > 80) {
          reasons.push("Price matches your target");
        }
      }
    }

    // Bedrooms match
    if (
      preferences.min_bedrooms !== null &&
      preferences.min_bedrooms > 0 &&
      preferences.max_bedrooms !== null &&
      preferences.max_bedrooms > 0
    ) {
      if (
        property.bedrooms >= preferences.min_bedrooms &&
        property.bedrooms <= preferences.max_bedrooms
      ) {
        scores.bedrooms = 100;
        reasons.push(`Perfect bedroom count (${property.bedrooms})`);
      } else {
        const minDiff = Math.abs(property.bedrooms - preferences.min_bedrooms);
        const maxDiff = Math.abs(property.bedrooms - preferences.max_bedrooms);
        const closestDiff = Math.min(minDiff, maxDiff);
        scores.bedrooms = Math.max(0, 100 - closestDiff * 25);

        if (scores.bedrooms > 60) {
          reasons.push(`Close to your preferred bedroom count`);
        }
      }
    }

    // Property type match
    if (preferences.property_type && preferences.property_type.length > 0) {
      if (preferences.property_type.includes(property.property_type)) {
        scores.property_type = 100;
        reasons.push(`Perfect property type match (${property.property_type})`);
      } else {
        // Partial match for similar types
        const typeSimilarity = this.calculatePropertyTypeSimilarity(
          property.property_type,
          preferences.property_type[0] // Use first preference for similarity calculation
        );
        scores.property_type = typeSimilarity * 100;

        if (scores.property_type > 60) {
          reasons.push(`Similar property type`);
        }
      }
    }

    // Furnishing match
    if (preferences.furnishing && preferences.furnishing !== "any") {
      if (property.furnishing === preferences.furnishing) {
        scores.furnishing = 100;
        reasons.push(`Perfect furnishing match (${property.furnishing})`);
      } else {
        scores.furnishing = 0;
      }
    }

    // Lifestyle features match
    if (
      preferences.lifestyle_features &&
      preferences.lifestyle_features.length > 0
    ) {
      const propertyFeatures = property.lifestyle_features || [];
      const matchingFeatures = preferences.lifestyle_features.filter(
        (feature) => propertyFeatures.includes(feature)
      );

      if (matchingFeatures.length > 0) {
        const featureScore =
          (matchingFeatures.length / preferences.lifestyle_features.length) *
          100;
        scores.lifestyle_features = featureScore;
        reasons.push(
          `Includes ${matchingFeatures.length} of your preferred features`
        );
      } else {
        scores.lifestyle_features = 0;
      }
    }

    // Calculate weighted total score
    let totalScore = 0;
    let totalWeight = 0;

    for (const [criteria, score] of Object.entries(scores)) {
      totalScore += score * baseWeights[criteria];
      totalWeight += baseWeights[criteria];
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const perfectMatch = finalScore >= 90 && reasons.length >= 3;

    return {
      score: finalScore,
      reasons,
      perfectMatch,
    };
  }

  /**
   * Calculate similarity between property types
   */
  private calculatePropertyTypeSimilarity(
    propertyType: string,
    preferredType: string
  ): number {
    const typeGroups = {
      apartment: ["apartment", "flat", "studio"],
      house: ["house", "detached", "semi-detached", "terraced"],
      flat: ["flat", "apartment", "studio"],
      studio: ["studio", "apartment", "flat"],
    };

    for (const [group, types] of Object.entries(typeGroups)) {
      if (types.includes(propertyType) && types.includes(preferredType)) {
        return 0.8; // High similarity within group
      }
    }

    return 0.2; // Low similarity across groups
  }

  /**
   * Check if property is a perfect match
   */
  isPerfectMatch(property: Property, preferences: Preferences): boolean {
    const matchScore = this.calculateMatchScore(property, preferences);
    return matchScore.perfectMatch;
  }

  /**
   * Get match reasons for a property
   */
  getMatchReasons(property: Property, preferences: Preferences): string[] {
    const matchScore = this.calculateMatchScore(property, preferences);
    return matchScore.reasons;
  }
}
