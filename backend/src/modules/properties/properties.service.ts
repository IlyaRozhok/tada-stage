import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Property } from "../../entities/property.entity";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { MatchingService } from "../matching/matching.service";
import { Favourite } from "../../entities/favourite.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Favourite)
    private readonly favouriteRepository: Repository<Favourite>,
    @InjectRepository(Shortlist)
    private readonly shortlistRepository: Repository<Shortlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly matchingService: MatchingService,
    private readonly s3Service: S3Service
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string,
    userRoles?: string[]
  ): Promise<Property> {
    // For admins, use the operator_id from the DTO if provided, otherwise use their own ID
    const isAdmin = userRoles?.includes("admin");
    const operatorId =
      isAdmin && createPropertyDto.operator_id
        ? createPropertyDto.operator_id
        : userId;

    const property = this.propertyRepository.create({
      ...createPropertyDto,
      operator_id: operatorId,
    });

    const savedProperty = await this.propertyRepository.save(property);

    // Trigger matching for all tenants
    await this.matchingService.generateMatches(savedProperty.id);

    return savedProperty;
  }

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

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    order?: 'ASC' | 'DESC'
  ): Promise<{
    properties: Property[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Ensure page and limit are valid numbers
    const validPage = Math.max(1, Math.floor(Number(page)) || 1);
    const validLimit = Math.max(1, Math.min(100, Math.floor(Number(limit)) || 10));
    
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.operator", "operator")
      .leftJoinAndSelect("property.media", "media");

    // Handle sorting
    if (sortBy && order) {
      const validSortFields = {
        'title': 'property.title',
        'location': 'property.address', // Map location to address field
        'price': 'property.price',
        'bedrooms': 'property.bedrooms',
        'bathrooms': 'property.bathrooms',
        'property_type': 'property.property_type',
        'created_at': 'property.created_at'
      };

      const sortField = validSortFields[sortBy] || 'property.created_at';
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      queryBuilder.orderBy(sortField, sortOrder);
    } else {
      // Default sorting
      queryBuilder.orderBy("property.created_at", "DESC");
    }

    if (search) {
      queryBuilder.where(
        "property.title ILIKE :search OR property.description ILIKE :search OR property.address ILIKE :search",
        { search: `%${search}%` }
      );
    }

    const [properties, total] = await queryBuilder
      .skip((validPage - 1) * validLimit)
      .take(validLimit)
      .getManyAndCount();

    // Update presigned URLs for all properties
    const propertiesWithUrls =
      await this.updateMultiplePropertiesMediaUrls(properties);

    return {
      properties: propertiesWithUrls,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ["operator", "media"],
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Update presigned URLs for media
    return await this.updateMediaPresignedUrls(property);
  }

  async findByOperator(operatorId: string): Promise<Property[]> {
    const properties = await this.propertyRepository.find({
      where: { operator_id: operatorId },
      relations: ["media"],
      order: { created_at: "DESC" },
    });

    return await this.updateMultiplePropertiesMediaUrls(properties);
  }

  async update(
    id: string,
    updatePropertyDto: Partial<CreatePropertyDto>,
    userId: string,
    userRoles?: string[]
  ): Promise<Property> {
    const property = await this.findOne(id);

    // Check if user is admin or if they own the property
    const isAdmin = userRoles?.includes("admin");
    if (!isAdmin && property.operator_id !== userId) {
      throw new ForbiddenException("You can only update your own properties");
    }

    Object.assign(property, updatePropertyDto);
    const updatedProperty = await this.propertyRepository.save(property);

    // Re-trigger matching after update
    await this.matchingService.generateMatches(updatedProperty.id);

    return updatedProperty;
  }

  async remove(
    id: string,
    userId: string,
    userRoles?: string[]
  ): Promise<void> {
    const property = await this.findOne(id);

    // Check if user is admin or if they own the property
    const isAdmin = userRoles?.includes("admin");
    if (!isAdmin && property.operator_id !== userId) {
      throw new ForbiddenException("You can only delete your own properties");
    }

    await this.propertyRepository.remove(property);
  }

  async getPropertyFavourites(propertyId: string): Promise<Favourite[]> {
    return await this.favouriteRepository.find({
      where: { propertyId: propertyId },
      relations: ["user"],
    });
  }

  async getPropertyShortlists(propertyId: string): Promise<Shortlist[]> {
    return await this.shortlistRepository.find({
      where: { propertyId: propertyId },
      relations: ["user"],
    });
  }

  async getPropertiesForMatching(): Promise<Property[]> {
    return await this.propertyRepository.find({
      relations: ["media"],
      order: { created_at: "DESC" },
    });
  }

  async getMatchingProperties(userIds: string[]): Promise<Property[]> {
    return await this.propertyRepository.find({
      where: {
        operator_id: In(userIds),
      },
      relations: ["media"],
      order: { created_at: "DESC" },
    });
  }

  async findFeaturedProperties(limit: number = 6): Promise<Property[]> {
    const properties = await this.propertyRepository.find({
      relations: ["operator", "media"],
      order: { created_at: "DESC" },
      take: limit,
    });

    return await this.updateMultiplePropertiesMediaUrls(properties);
  }

  async findMatchedProperties(
    userId: string,
    limit: number = 6
  ): Promise<Property[]> {
    return await this.matchingService.findMatchedProperties(userId, limit);
  }

  async getOperatorStatistics(operatorId: string): Promise<any> {
    const totalProperties = await this.propertyRepository.count({
      where: { operator_id: operatorId },
    });

    const totalFavourites = await this.favouriteRepository
      .createQueryBuilder("favourite")
      .innerJoin("favourite.property", "property")
      .where("property.operator_id = :operatorId", { operatorId })
      .getCount();

    const totalShortlists = await this.shortlistRepository
      .createQueryBuilder("shortlist")
      .innerJoin("shortlist.property", "property")
      .where("property.operator_id = :operatorId", { operatorId })
      .getCount();

    return {
      totalProperties,
      totalFavourites,
      totalShortlists,
    };
  }

  async getInterestedTenants(
    propertyId: string,
    operatorId: string
  ): Promise<any> {
    const property = await this.findOne(propertyId);

    if (property.operator_id !== operatorId) {
      throw new ForbiddenException(
        "You can only view interested tenants for your own properties"
      );
    }

    const favourites = await this.favouriteRepository.find({
      where: { propertyId },
      relations: ["user"],
    });

    const shortlists = await this.shortlistRepository.find({
      where: { propertyId },
      relations: ["user"],
    });

    return {
      favourites: favourites.map((f) => ({
        user: f.user,
        date: f.created_at,
      })),
      shortlists: shortlists.map((s) => ({
        user: s.user,
        date: s.created_at,
      })),
    };
  }
}
