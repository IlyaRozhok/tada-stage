import { Injectable } from "@nestjs/common";
import { Property } from "../../../entities/property.entity";
import { S3Service } from "../../../common/services/s3.service";

@Injectable()
export class MatchingMediaService {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * Update presigned URLs for property media
   */
  async updateMediaPresignedUrls(property: Property): Promise<Property> {
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
  async updateMultiplePropertiesMediaUrls(
    properties: Property[]
  ): Promise<Property[]> {
    for (const property of properties) {
      await this.updateMediaPresignedUrls(property);
    }
    return properties;
  }

  /**
   * Get media URLs for a property
   */
  async getPropertyMediaUrls(property: Property): Promise<string[]> {
    if (!property.media || property.media.length === 0) {
      return [];
    }

    const urls: string[] = [];

    for (const media of property.media) {
      try {
        const url = await this.s3Service.getPresignedUrl(media.s3_key);
        urls.push(url);
      } catch (error) {
        console.error("Error getting media URL:", error);
        // Fallback to direct S3 URL
        const fallbackUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${media.s3_key}`;
        urls.push(fallbackUrl);
      }
    }

    return urls;
  }

  /**
   * Check if property has media
   */
  hasMedia(property: Property): boolean {
    return property.media && property.media.length > 0;
  }

  /**
   * Get media count for a property
   */
  getMediaCount(property: Property): number {
    return property.media ? property.media.length : 0;
  }

  /**
   * Get primary media URL for a property
   */
  async getPrimaryMediaUrl(property: Property): Promise<string | null> {
    if (!this.hasMedia(property)) {
      return null;
    }

    try {
      const primaryMedia = property.media[0];
      return await this.s3Service.getPresignedUrl(primaryMedia.s3_key);
    } catch (error) {
      console.error("Error getting primary media URL:", error);
      return null;
    }
  }
}
