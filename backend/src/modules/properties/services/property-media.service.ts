import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../../entities/property.entity";
import { PropertyMedia } from "../../../entities/property-media.entity";
import { S3Service } from "../../../common/services/s3.service";

@Injectable()
export class PropertyMediaService {
  constructor(
    @InjectRepository(PropertyMedia)
    private propertyMediaRepository: Repository<PropertyMedia>,
    private s3Service: S3Service
  ) {}

  /**
   * Update presigned URLs for property media
   */
  async updateMediaPresignedUrls(property: Property): Promise<Property> {
    if (property.media && property.media.length > 0) {
      for (const media of property.media) {
        try {
          // Skip S3 processing for test media (direct URLs from Unsplash)
          if (
            media.s3_key.startsWith("test-media/") ||
            media.url?.includes("unsplash.com")
          ) {
            // Keep the existing URL for test data
            continue;
          }
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
  async updateMultiplePropertiesMediaUrls(
    properties: Property[]
  ): Promise<Property[]> {
    await Promise.all(
      properties.map((property) => this.updateMediaPresignedUrls(property))
    );
    return properties;
  }

  /**
   * Add isShortlisted flag to properties for a specific user
   */
  async addShortlistFlags(
    properties: Property[],
    userId?: string
  ): Promise<any[]> {
    if (!userId) {
      return properties.map((p) => ({ ...p, isShortlisted: false }));
    }

    // This would need to be implemented based on your shortlist logic
    // For now, returning properties with default shortlist flag
    return properties.map((p) => ({ ...p, isShortlisted: false }));
  }

  /**
   * Get property media by property ID
   */
  async getPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
    return this.propertyMediaRepository.find({
      where: { property_id: propertyId },
      order: { order_index: "ASC" },
    });
  }

  /**
   * Update media order for a property
   */
  async updateMediaOrder(
    propertyId: string,
    mediaIds: string[]
  ): Promise<void> {
    for (let i = 0; i < mediaIds.length; i++) {
      await this.propertyMediaRepository.update(
        { id: mediaIds[i], property_id: propertyId },
        { order_index: i }
      );
    }
  }

  /**
   * Set featured image for a property
   */
  async setFeaturedImage(propertyId: string, mediaId: string): Promise<void> {
    // Note: is_featured field doesn't exist in PropertyMedia entity
    // This method is a placeholder for future implementation
    console.log(`Setting featured image ${mediaId} for property ${propertyId}`);
  }

  /**
   * Delete property media
   */
  async deletePropertyMedia(mediaId: string): Promise<void> {
    const media = await this.propertyMediaRepository.findOne({
      where: { id: mediaId },
    });

    if (media) {
      // Delete from S3 if it's not test media
      if (!media.s3_key.startsWith("test-media/")) {
        try {
          await this.s3Service.deleteFile(media.s3_key);
        } catch (error) {
          console.error("Error deleting file from S3:", error);
        }
      }

      // Delete from database
      await this.propertyMediaRepository.remove(media);
    }
  }
}
