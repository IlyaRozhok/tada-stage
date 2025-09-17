import { Injectable } from "@nestjs/common";
import { Property } from "../../../entities/property.entity";
import { Preferences } from "../../../entities/preferences.entity";

export interface EnhancedMatchingScore {
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

export interface LocationData {
  lat: number;
  lng: number;
  postcode?: string;
  area?: string;
}

@Injectable()
export class MatchingCalculationEnhancedService {
  private readonly BASE_WEIGHTS = {
    price: 30,
    location: 25,
    property: 20,
    lifestyle: 15,
    availability: 5,
    freshness: 5,
  };

  private readonly LONDON_AREAS = {
    "central-london": { lat: 51.5074, lng: -0.1278 },
    "canary-wharf": { lat: 51.5054, lng: -0.0235 },
    shoreditch: { lat: 51.5255, lng: -0.0754 },
    "kings-cross": { lat: 51.5308, lng: -0.1238 },
    paddington: { lat: 51.5154, lng: -0.1755 },
    "south-bank": { lat: 51.5074, lng: -0.1195 },
    mayfair: { lat: 51.5074, lng: -0.1456 },
    holborn: { lat: 51.5174, lng: -0.12 },
    clerkenwell: { lat: 51.52, lng: -0.1 },
    bermondsey: { lat: 51.495, lng: -0.08 },
    stratford: { lat: 51.5416, lng: -0.0036 },
    hammersmith: { lat: 51.492, lng: -0.2229 },
    croydon: { lat: 51.3762, lng: -0.0982 },
  };

  /**
   * Calculate enhanced match score with advanced algorithms
   */
  calculateEnhancedMatchScore(
    property: Property,
    preferences: Preferences
  ): EnhancedMatchingScore {
    const categoryScores = {
      price: this.calculatePriceScore(property, preferences),
      location: this.calculateLocationScore(property, preferences),
      property: this.calculatePropertyScore(property, preferences),
      lifestyle: this.calculateLifestyleScore(property, preferences),
      availability: this.calculateAvailabilityScore(property, preferences),
      freshness: this.calculateFreshnessScore(property),
    };

    const reasons: string[] = [];
    let weightedScore = 0;
    let totalWeight = 0;

    // Calculate weighted score with dynamic weights
    for (const [category, score] of Object.entries(categoryScores)) {
      const weight = this.getDynamicWeight(category, preferences);
      weightedScore += score * weight;
      totalWeight += weight;

      // Add reasons for high-scoring categories
      if (score >= 80) {
        reasons.push(
          this.getCategoryReason(category, score, property, preferences)
        );
      }
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const perfectMatch = this.isPerfectMatch(categoryScores, preferences);

    return {
      score: finalScore,
      reasons,
      perfectMatch,
      categoryScores,
      weightedScore: finalScore,
    };
  }

  /**
   * Calculate price match score with advanced logic
   */
  private calculatePriceScore(
    property: Property,
    preferences: Preferences
  ): number {
    if (!preferences.min_price || !preferences.max_price) {
      return 50; // Neutral score if no price preference
    }

    const priceRange = preferences.max_price - preferences.min_price;
    const propertyPrice = property.price;

    // Perfect match within range
    if (
      propertyPrice >= preferences.min_price &&
      propertyPrice <= preferences.max_price
    ) {
      // Prefer lower end of range (30% from min)
      const idealPrice = preferences.min_price + priceRange * 0.3;
      const distanceFromIdeal = Math.abs(propertyPrice - idealPrice);
      const maxDistance = priceRange * 0.7; // 70% of range is acceptable

      return Math.max(0, 100 - (distanceFromIdeal / maxDistance) * 100);
    }

    // Outside range - calculate penalty
    const overBudget = propertyPrice > preferences.max_price;
    const underBudget = propertyPrice < preferences.min_price;

    if (overBudget) {
      const excess = propertyPrice - preferences.max_price;
      const penalty = Math.min(50, (excess / preferences.max_price) * 100);
      return Math.max(0, 50 - penalty);
    }

    if (underBudget) {
      const deficit = preferences.min_price - propertyPrice;
      const penalty = Math.min(30, (deficit / preferences.min_price) * 100);
      return Math.max(0, 70 - penalty);
    }

    return 0;
  }

  /**
   * Calculate location match score with geographic intelligence
   */
  private calculateLocationScore(
    property: Property,
    preferences: Preferences
  ): number {
    let score = 0;
    let factors = 0;

    // Primary postcode match
    if (preferences.primary_postcode && property.address) {
      const postcodeMatch = this.calculatePostcodeSimilarity(
        preferences.primary_postcode,
        property.address
      );
      score += postcodeMatch * 40;
      factors += 40;
    }

    // Secondary location match
    if (
      preferences.secondary_location &&
      preferences.secondary_location !== "no-preference"
    ) {
      const locationMatch = this.calculateLocationProximity(
        property,
        preferences.secondary_location
      );
      score += locationMatch * 30;
      factors += 30;
    }

    // Commute location match
    if (
      preferences.commute_location &&
      preferences.commute_location !== "no-preference"
    ) {
      const commuteMatch = this.calculateCommuteScore(property, preferences);
      score += commuteMatch * 30;
      factors += 30;
    }

    return factors > 0 ? score / factors : 50;
  }

  /**
   * Calculate property match score (bedrooms, type, furnishing)
   */
  private calculatePropertyScore(
    property: Property,
    preferences: Preferences
  ): number {
    let score = 0;
    let factors = 0;

    // Bedrooms match
    if (preferences.min_bedrooms && preferences.max_bedrooms) {
      const bedroomScore = this.calculateBedroomScore(property, preferences);
      score += bedroomScore * 40;
      factors += 40;
    }

    // Property type match
    if (preferences.property_type && preferences.property_type.length > 0) {
      const typeScore = this.calculatePropertyTypeScore(property, preferences);
      score += typeScore * 35;
      factors += 35;
    }

    // Furnishing match
    if (preferences.furnishing && preferences.furnishing !== "any") {
      const furnishingScore =
        property.furnishing === preferences.furnishing ? 100 : 0;
      score += furnishingScore * 25;
      factors += 25;
    }

    return factors > 0 ? score / factors : 50;
  }

  /**
   * Calculate lifestyle features match score
   */
  private calculateLifestyleScore(
    property: Property,
    preferences: Preferences
  ): number {
    if (
      !preferences.lifestyle_features ||
      preferences.lifestyle_features.length === 0
    ) {
      return 50;
    }

    const propertyFeatures = property.lifestyle_features || [];
    const matchingFeatures = preferences.lifestyle_features.filter((feature) =>
      propertyFeatures.includes(feature)
    );

    const featureScore =
      (matchingFeatures.length / preferences.lifestyle_features.length) * 100;

    // Bonus for having additional desirable features
    const bonusFeatures = this.getBonusFeatures(propertyFeatures);
    const bonusScore = Math.min(20, bonusFeatures * 5);

    return Math.min(100, featureScore + bonusScore);
  }

  /**
   * Calculate availability match score
   */
  private calculateAvailabilityScore(
    property: Property,
    preferences: Preferences
  ): number {
    if (!preferences.move_in_date || !property.available_from) {
      return 50;
    }

    const moveInDate = new Date(preferences.move_in_date);
    const availableFrom = new Date(property.available_from);
    const daysDiff = Math.ceil(
      (availableFrom.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Perfect if available exactly when needed
    if (daysDiff === 0) return 100;

    // Good if available within 30 days before or after
    if (Math.abs(daysDiff) <= 30) {
      return Math.max(60, 100 - Math.abs(daysDiff) * 2);
    }

    // Penalty for longer delays
    return Math.max(0, 60 - Math.abs(daysDiff) * 0.5);
  }

  /**
   * Calculate freshness score (newer properties get higher scores)
   */
  private calculateFreshnessScore(property: Property): number {
    const daysSinceCreated = Math.ceil(
      (Date.now() - new Date(property.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Fresh properties (0-7 days) get highest score
    if (daysSinceCreated <= 7) return 100;

    // Recent properties (8-30 days) get good score
    if (daysSinceCreated <= 30) return 80;

    // Older properties get diminishing scores
    return Math.max(20, 80 - (daysSinceCreated - 30) * 0.5);
  }

  /**
   * Calculate bedroom match score
   */
  private calculateBedroomScore(
    property: Property,
    preferences: Preferences
  ): number {
    const bedrooms = property.bedrooms;
    const minBedrooms = preferences.min_bedrooms!;
    const maxBedrooms = preferences.max_bedrooms!;

    if (bedrooms >= minBedrooms && bedrooms <= maxBedrooms) {
      return 100;
    }

    // Calculate penalty for being outside range
    const distanceFromMin = Math.abs(bedrooms - minBedrooms);
    const distanceFromMax = Math.abs(bedrooms - maxBedrooms);
    const closestDistance = Math.min(distanceFromMin, distanceFromMax);

    return Math.max(0, 100 - closestDistance * 25);
  }

  /**
   * Calculate property type match score
   */
  private calculatePropertyTypeScore(
    property: Property,
    preferences: Preferences
  ): number {
    const propertyType = property.property_type;
    const preferredTypes = preferences.property_type!;

    if (preferredTypes.includes(propertyType)) {
      return 100;
    }

    // Check for similar types
    const similarity = this.calculatePropertyTypeSimilarity(
      propertyType,
      preferredTypes[0]
    );
    return similarity * 100;
  }

  /**
   * Calculate property type similarity
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
        return 0.8;
      }
    }

    return 0.2;
  }

  /**
   * Calculate postcode similarity
   */
  private calculatePostcodeSimilarity(
    preferredPostcode: string,
    propertyAddress: string
  ): number {
    const preferredArea = preferredPostcode.split(" ")[0];
    const propertyPostcode = this.extractPostcode(propertyAddress);

    if (!propertyPostcode) return 0;

    const propertyArea = propertyPostcode.split(" ")[0];

    if (preferredArea === propertyArea) return 1.0;

    // Check for nearby areas (simplified)
    const nearbyAreas = this.getNearbyAreas(preferredArea);
    return nearbyAreas.includes(propertyArea) ? 0.7 : 0.3;
  }

  /**
   * Calculate location proximity score
   */
  private calculateLocationProximity(
    property: Property,
    preferredLocation: string
  ): number {
    if (!property.lat || !property.lng) return 0;

    const preferredCoords = this.LONDON_AREAS[preferredLocation];
    if (!preferredCoords) return 0;

    const distance = this.calculateDistance(
      property.lat,
      property.lng,
      preferredCoords.lat,
      preferredCoords.lng
    );

    // Score based on distance (in km)
    if (distance <= 1) return 100;
    if (distance <= 3) return 80;
    if (distance <= 5) return 60;
    if (distance <= 10) return 40;
    return 20;
  }

  /**
   * Calculate commute score
   */
  private calculateCommuteScore(
    property: Property,
    preferences: Preferences
  ): number {
    if (!property.lat || !property.lng) return 0;

    const commuteLocation = preferences.commute_location!;
    const commuteCoords = this.LONDON_AREAS[commuteLocation];
    if (!commuteCoords) return 0;

    const distance = this.calculateDistance(
      property.lat,
      property.lng,
      commuteCoords.lat,
      commuteCoords.lng
    );

    // Calculate commute time estimates
    const walkTime = distance * 12; // 5 km/h walking speed
    const cycleTime = distance * 4; // 15 km/h cycling speed
    const tubeTime = distance * 2; // 30 km/h tube speed (simplified)

    let score = 0;
    let factors = 0;

    // Check walking commute
    if (preferences.commute_time_walk) {
      const walkScore =
        walkTime <= preferences.commute_time_walk
          ? 100
          : Math.max(0, 100 - (walkTime - preferences.commute_time_walk) * 2);
      score += walkScore * 0.3;
      factors += 0.3;
    }

    // Check cycling commute
    if (preferences.commute_time_cycle) {
      const cycleScore =
        cycleTime <= preferences.commute_time_cycle
          ? 100
          : Math.max(0, 100 - (cycleTime - preferences.commute_time_cycle) * 2);
      score += cycleScore * 0.3;
      factors += 0.3;
    }

    // Check tube commute
    if (preferences.commute_time_tube) {
      const tubeScore =
        tubeTime <= preferences.commute_time_tube
          ? 100
          : Math.max(0, 100 - (tubeTime - preferences.commute_time_tube) * 2);
      score += tubeScore * 0.4;
      factors += 0.4;
    }

    return factors > 0 ? score / factors : 50;
  }

  /**
   * Get dynamic weights based on user preferences
   */
  private getDynamicWeight(category: string, preferences: Preferences): number {
    const baseWeight = this.BASE_WEIGHTS[category];

    // Adjust weights based on preference completeness
    switch (category) {
      case "price":
        return preferences.min_price && preferences.max_price
          ? baseWeight
          : baseWeight * 0.5;
      case "location":
        return preferences.primary_postcode || preferences.secondary_location
          ? baseWeight
          : baseWeight * 0.3;
      case "property":
        return preferences.min_bedrooms || preferences.property_type?.length
          ? baseWeight
          : baseWeight * 0.5;
      case "lifestyle":
        return preferences.lifestyle_features?.length
          ? baseWeight
          : baseWeight * 0.3;
      default:
        return baseWeight;
    }
  }

  /**
   * Get category-specific reason
   */
  private getCategoryReason(
    category: string,
    score: number,
    property: Property,
    preferences: Preferences
  ): string {
    switch (category) {
      case "price":
        return `Price fits your budget (£${property.price}/month)`;
      case "location":
        return `Great location for your commute`;
      case "property":
        return `Perfect ${property.property_type} with ${property.bedrooms} bedrooms`;
      case "lifestyle":
        return `Includes your preferred lifestyle features`;
      case "availability":
        return `Available when you need it`;
      case "freshness":
        return `Recently added property`;
      default:
        return `Strong match in ${category}`;
    }
  }

  /**
   * Check if property is a perfect match
   */
  private isPerfectMatch(
    categoryScores: Record<string, number>,
    preferences: Preferences
  ): boolean {
    const requiredCategories = ["price", "property"];
    const highScoreCategories = requiredCategories.filter(
      (cat) => categoryScores[cat] >= 90
    );

    return (
      highScoreCategories.length >= 2 &&
      Object.values(categoryScores).some((score: number) => score >= 80)
    );
  }

  /**
   * Get bonus features for lifestyle scoring
   */
  private getBonusFeatures(propertyFeatures: string[]): number {
    const premiumFeatures = ["concierge", "gym", "pool", "rooftop", "parking"];
    return propertyFeatures.filter((feature) =>
      premiumFeatures.includes(feature)
    ).length;
  }

  /**
   * Extract postcode from address
   */
  private extractPostcode(address: string): string | null {
    const postcodeRegex = /[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}/i;
    const match = address.match(postcodeRegex);
    return match ? match[0].toUpperCase() : null;
  }

  /**
   * Get nearby areas for postcode matching
   */
  private getNearbyAreas(area: string): string[] {
    const areaGroups = {
      SW: ["SW", "SE", "W"],
      SE: ["SE", "SW", "E"],
      W: ["W", "SW", "NW"],
      E: ["E", "SE", "EC"],
      N: ["N", "NW", "EC"],
      NW: ["NW", "N", "W"],
      EC: ["EC", "E", "N"],
    };

    return areaGroups[area] || [area];
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
