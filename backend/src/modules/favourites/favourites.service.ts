import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Favourite } from "../../entities/favourite.entity";
import { Property } from "../../entities/property.entity";

@Injectable()
export class FavouritesService {
  constructor(
    @InjectRepository(Favourite)
    private favouriteRepository: Repository<Favourite>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>
  ) {}

  async addToFavourites(
    userId: string,
    propertyId: string
  ): Promise<Favourite> {
    // Check if property exists
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Check if already favourited
    const existing = await this.favouriteRepository.findOne({
      where: { userId, propertyId },
    });

    if (existing) {
      throw new ConflictException("Property already in favourites");
    }

    // Create favourite entry
    const favouriteEntry = this.favouriteRepository.create({
      userId,
      propertyId,
    });

    return await this.favouriteRepository.save(favouriteEntry);
  }

  async removeFromFavourites(
    userId: string,
    propertyId: string
  ): Promise<void> {
    const favouriteEntry = await this.favouriteRepository.findOne({
      where: { userId, propertyId },
    });

    if (!favouriteEntry) {
      throw new NotFoundException("Property not found in favourites");
    }

    await this.favouriteRepository.remove(favouriteEntry);
  }

  async getUserFavourites(userId: string): Promise<Property[]> {
    const favouriteEntries = await this.favouriteRepository.find({
      where: { userId },
      relations: ["property", "property.operator"],
      order: { created_at: "DESC" },
    });

    return favouriteEntries.map((entry) => entry.property);
  }

  async isPropertyFavourited(
    userId: string,
    propertyId: string
  ): Promise<boolean> {
    const favouriteEntry = await this.favouriteRepository.findOne({
      where: { userId, propertyId },
    });

    return !!favouriteEntry;
  }

  async getFavouritesCount(userId: string): Promise<number> {
    return await this.favouriteRepository.count({
      where: { userId },
    });
  }
}
