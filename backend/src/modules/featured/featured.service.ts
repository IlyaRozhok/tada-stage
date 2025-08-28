import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { PropertiesService } from "../properties/properties.service";

export interface ResidentialComplex {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  totalUnits: number;
  priceFrom: number;
  priceTo: number;
  amenities: string[];
  completionDate: string;
  developer: string;
  website?: string;
}

export interface HomeCard {
  id: string;
  type: "property" | "residential-complex" | "info";
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  primaryAction: {
    text: string;
    url: string;
  };
  secondaryAction?: {
    text: string;
    url: string;
  };
  badge?: {
    text: string;
    variant: "new" | "featured" | "popular";
  };
  metadata?: {
    price?: string;
    location?: string;
    features?: string[];
  };
}

@Injectable()
export class FeaturedService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    private propertiesService: PropertiesService
  ) {}

  async getFeaturedResidentialComplexes(
    limit: number = 3
  ): Promise<ResidentialComplex[]> {
    // Mock data for London residential complexes
    // In a real application, this would come from a database
    const complexes: ResidentialComplex[] = [
      {
        id: "1",
        name: "The Landmark Pinnacle",
        location: "Canary Wharf, London",
        description:
          "London's tallest residential tower offering luxury living with breathtaking views across the city.",
        imageUrl:
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&crop=edges",
        totalUnits: 822,
        priceFrom: 500000,
        priceTo: 2500000,
        amenities: [
          "Gym",
          "Spa",
          "Concierge",
          "Sky Garden",
          "Cinema",
          "Business Lounge",
        ],
        completionDate: "2024",
        developer: "Chalegrove Properties",
        website: "https://landmarkpinnacle.com",
      },
      {
        id: "2",
        name: "One Thames City",
        location: "Nine Elms, London",
        description:
          "A stunning riverside development featuring contemporary apartments with panoramic Thames views.",
        imageUrl:
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=edges",
        totalUnits: 436,
        priceFrom: 650000,
        priceTo: 3200000,
        amenities: [
          "Swimming Pool",
          "Gym",
          "Residents' Lounge",
          "Roof Terrace",
          "Concierge",
        ],
        completionDate: "2025",
        developer: "R&F Properties",
      },
      {
        id: "3",
        name: "Aykon London One",
        location: "Vauxhall, London",
        description:
          "An iconic tower offering premium residences in the heart of London's most dynamic district.",
        imageUrl:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&crop=edges",
        totalUnits: 648,
        priceFrom: 700000,
        priceTo: 4500000,
        amenities: [
          "Infinity Pool",
          "Spa",
          "Private Cinema",
          "Sky Lounge",
          "Concierge",
          "Valet Parking",
        ],
        completionDate: "2025",
        developer: "DAMAC Properties",
      },
    ];

    return complexes.slice(0, limit);
  }

  async getFeaturedProperties(
    limit: number = 6,
    userId?: string
  ): Promise<any[]> {
    // Use PropertiesService to get featured properties with shortlist flags
    return this.propertiesService.findFeaturedProperties(limit, userId);
  }

  async getHomeCards(): Promise<HomeCard[]> {
    const [complexes, properties] = await Promise.all([
      this.getFeaturedResidentialComplexes(2),
      this.getFeaturedProperties(3),
    ]);

    const cards: HomeCard[] = [];

    // Add residential complex cards
    complexes.forEach((complex, index) => {
      cards.push({
        id: `complex-${complex.id}`,
        type: "residential-complex",
        title: complex.name,
        subtitle: complex.location,
        description: complex.description,
        imageUrl: complex.imageUrl,
        primaryAction: {
          text: "Learn More",
          url: `/residential-complexes/${complex.id}`,
        },
        secondaryAction: {
          text: "View Properties",
          url: "/properties?complex=" + complex.id,
        },
        badge:
          index === 0 ? { text: "New Development", variant: "new" } : undefined,
        metadata: {
          price: `From £${(complex.priceFrom / 1000).toFixed(0)}k`,
          location: complex.location,
          features: complex.amenities.slice(0, 3),
        },
      });
    });

    // Add property cards
    properties.slice(0, 2).forEach((property, index) => {
      const imageUrl =
        property.media?.[0]?.url ||
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=edges";

      cards.push({
        id: `property-${property.id}`,
        type: "property",
        title: property.title,
        subtitle: property.address,
        description:
          property.description || "Beautiful property in prime location.",
        imageUrl,
        primaryAction: {
          text: "View Details",
          url: `/properties/${property.id}`,
        },
        secondaryAction: {
          text: "Save Property",
          url: `/app/shortlist?add=${property.id}`,
        },
        badge:
          index === 0 ? { text: "Featured", variant: "featured" } : undefined,
        metadata: {
          price: `£${property.price.toLocaleString()}`,
          location: property.address,
          features: [
            `${property.bedrooms} bed`,
            `${property.bathrooms} bath`,
            property.property_type,
          ],
        },
      });
    });

    // Add info card about TaDa platform
    cards.push({
      id: "info-platform",
      type: "info",
      title: "Discover Your Perfect Match",
      subtitle: "AI-Powered Property Matching",
      description:
        "Our smart matching algorithm learns your preferences and lifestyle to suggest properties that truly fit your needs.",
      imageUrl:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=edges",
      primaryAction: {
        text: "Take Lifestyle Quiz",
        url: "/app/preferences",
      },
      secondaryAction: {
        text: "Learn How It Works",
        url: "/how-it-works",
      },
      badge: { text: "Smart Matching", variant: "popular" },
      metadata: {
        features: ["AI Matching", "Lifestyle Quiz", "Personalized Results"],
      },
    });

    return cards;
  }
}
