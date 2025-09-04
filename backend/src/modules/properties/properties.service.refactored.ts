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
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { UserRole } from "../../entities/user.entity";
import { PropertyMediaService } from "./services/property-media.service";

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Shortlist)
    private readonly shortlistRepository: Repository<Shortlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private readonly tenantProfileRepository: Repository<TenantProfile>,
    private readonly matchingService: MatchingService,
    private readonly propertyMediaService: PropertyMediaService
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

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    order?: "ASC" | "DESC",
    userId?: string
  ): Promise<{
    properties: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Ensure page and limit are valid numbers
    const validPage = Math.max(1, Math.floor(Number(page)) || 1);
    const validLimit = Math.max(
      1,
      Math.min(100, Math.floor(Number(limit)) || 10)
    );

    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.operator", "operator")
      .leftJoinAndSelect("property.media", "media");

    // Handle sorting
    if (sortBy && order) {
      const validSortFields = {
        title: "property.title",
        location: "property.address", // Map location to address field
        price: "property.price",
        bedrooms: "property.bedrooms",
        bathrooms: "property.bathrooms",
        property_type: "property.property_type",
        created_at: "property.created_at",
      };

      const sortField = validSortFields[sortBy] || "property.created_at";
      const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

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
      await this.propertyMediaService.updateMultiplePropertiesMediaUrls(
        properties
      );

    // Add shortlist flags
    const propertiesWithFlags =
      await this.propertyMediaService.addShortlistFlags(
        propertiesWithUrls,
        userId
      );

    return {
      properties: propertiesWithFlags,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ["operator", "media"],
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    console.log("🏠 Backend - Property found:", property.id);
    console.log("🖼️ Backend - Property media before URLs:", property.media);

    // Update presigned URLs for media
    const propertyWithUrls =
      await this.propertyMediaService.updateMediaPresignedUrls(property);

    console.log(
      "🖼️ Backend - Property media after URLs:",
      propertyWithUrls.media
    );

    // Add shortlist flag
    const [propertyWithFlag] =
      await this.propertyMediaService.addShortlistFlags(
        [propertyWithUrls],
        userId
      );

    console.log("🖼️ Backend - Final property media:", propertyWithFlag.media);

    return propertyWithFlag;
  }

  async findByOperator(operatorId: string, userId?: string): Promise<any[]> {
    const properties = await this.propertyRepository.find({
      where: { operator_id: operatorId },
      relations: ["media"],
      order: { created_at: "DESC" },
    });

    const propertiesWithUrls =
      await this.propertyMediaService.updateMultiplePropertiesMediaUrls(
        properties
      );
    return await this.propertyMediaService.addShortlistFlags(
      propertiesWithUrls,
      userId
    );
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

    const totalShortlists = await this.shortlistRepository
      .createQueryBuilder("shortlist")
      .innerJoin("shortlist.property", "property")
      .where("property.operator_id = :operatorId", { operatorId })
      .getCount();

    return {
      totalProperties,
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

    const shortlists = await this.shortlistRepository.find({
      where: { propertyId },
      relations: ["user"],
    });

    return {
      shortlists: shortlists.map((s) => ({
        user: s.user,
        date: s.created_at,
      })),
    };
  }
}
