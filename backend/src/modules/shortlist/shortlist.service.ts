import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Property } from "../../entities/property.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { User, UserRole } from "../../entities/user.entity";
import { S3Service } from "../../common/services/s3.service";

@Injectable()
export class ShortlistService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
   * Get tenant profile for a user
   */
  private async getTenantProfile(userId: string): Promise<TenantProfile> {
    // First check if user is a tenant
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== UserRole.Tenant) {
      throw new BadRequestException("Only tenants can have shortlists");
    }

    if (!user.tenantProfile) {
      throw new NotFoundException("Tenant profile not found");
    }

    return user.tenantProfile;
  }

  async addToShortlist(
    userId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> {
    // Check if property exists
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Initialize shortlisted_properties if null
    const currentShortlist = tenantProfile.shortlisted_properties || [];

    // Check if already shortlisted - if yes, just return success (idempotent operation)
    if (currentShortlist.includes(propertyId)) {
      return {
        success: true,
        message: "Property already in shortlist",
      };
    }

    // Add to shortlist
    const updatedShortlist = [...currentShortlist, propertyId];
    tenantProfile.shortlisted_properties = updatedShortlist;

    await this.tenantProfileRepository.save(tenantProfile);

    return {
      success: true,
      message: "Property added to shortlist successfully",
    };
  }

  async removeFromShortlist(
    userId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> {
    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Initialize shortlisted_properties if null
    const currentShortlist = tenantProfile.shortlisted_properties || [];

    // Check if property is in shortlist - if not, just return success (idempotent operation)
    if (!currentShortlist.includes(propertyId)) {
      return {
        success: true,
        message: "Property not in shortlist (already removed)",
      };
    }

    // Remove from shortlist
    const updatedShortlist = currentShortlist.filter((id) => id !== propertyId);
    tenantProfile.shortlisted_properties = updatedShortlist;

    await this.tenantProfileRepository.save(tenantProfile);

    return {
      success: true,
      message: "Property removed from shortlist successfully",
    };
  }

  async getUserShortlist(userId: string): Promise<Property[]> {
    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Get shortlisted property IDs
    const shortlistedPropertyIds = tenantProfile.shortlisted_properties || [];

    if (shortlistedPropertyIds.length === 0) {
      return [];
    }

    // Fetch properties with media and operator relations
    const properties = await this.propertyRepository.find({
      where: { id: In(shortlistedPropertyIds) },
      relations: ["media", "operator"],
      order: { created_at: "DESC" },
    });

    // Update presigned URLs for all properties
    return await this.updateMultiplePropertiesMediaUrls(properties);
  }

  async isPropertyShortlisted(
    userId: string,
    propertyId: string
  ): Promise<boolean> {
    try {
      // Get tenant profile
      const tenantProfile = await this.getTenantProfile(userId);

      // Check if property is in shortlist
      const shortlistedPropertyIds = tenantProfile.shortlisted_properties || [];
      return shortlistedPropertyIds.includes(propertyId);
    } catch (error) {
      // If user is not a tenant or profile doesn't exist, return false
      return false;
    }
  }

  async getShortlistCount(userId: string): Promise<number> {
    try {
      // Get tenant profile
      const tenantProfile = await this.getTenantProfile(userId);

      // Return count of shortlisted properties
      const shortlistedPropertyIds = tenantProfile.shortlisted_properties || [];
      return shortlistedPropertyIds.length;
    } catch (error) {
      // If user is not a tenant or profile doesn't exist, return 0
      return 0;
    }
  }

  async clearShortlist(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    // Get tenant profile
    const tenantProfile = await this.getTenantProfile(userId);

    // Clear shortlist
    tenantProfile.shortlisted_properties = [];

    await this.tenantProfileRepository.save(tenantProfile);

    return {
      success: true,
      message: "Shortlist cleared successfully",
    };
  }
}
