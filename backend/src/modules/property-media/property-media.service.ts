import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PropertyMedia } from "../../entities/property-media.entity";
import { Property } from "../../entities/property.entity";
import { S3Service } from "../../common/services/s3.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class PropertyMediaService {
  constructor(
    @InjectRepository(PropertyMedia)
    private readonly propertyMediaRepository: Repository<PropertyMedia>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Get media with fresh presigned URL
   */
  async getMediaWithPresignedUrl(mediaId: string): Promise<PropertyMedia> {
    const media = await this.propertyMediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException("Media not found");
    }

    // Generate fresh presigned URL for viewing
    try {
      media.url = await this.s3Service.getPresignedUrl(media.s3_key);
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      // Fallback to S3 direct URL if presigned URL fails
      media.url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${media.s3_key}`;
    }

    return media;
  }

  /**
   * Get all media for a property with fresh presigned URLs
   */
  async getAllPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
    const media = await this.propertyMediaRepository.find({
      where: { property_id: propertyId },
      order: { order_index: "ASC" },
    });

    // Generate fresh presigned URLs for all media
    for (const item of media) {
      try {
        item.url = await this.s3Service.getPresignedUrl(item.s3_key);
      } catch (error) {
        console.error(
          "Error generating presigned URL for media:",
          item.id,
          error
        );
        // Fallback to S3 direct URL
        item.url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.s3_key}`;
      }
    }

    return media;
  }

  /**
   * Upload media file for property
   */
  async uploadFile(
    propertyId: string,
    userId: string,
    file: Express.Multer.File,
    orderIndex?: number,
    isFeatured?: boolean,
    userRole?: string
  ): Promise<PropertyMedia> {
    console.log("🔧 PropertyMediaService.uploadFile started");
    console.log("- propertyId:", propertyId);
    console.log("- userId:", userId);
    console.log("- file.originalname:", file.originalname);
    console.log("- file.size:", file.size);
    console.log("- file.mimetype:", file.mimetype);

    try {
      // Verify property exists and user owns it
      console.log("🔍 Verifying property ownership...");
      const property = await this.propertyRepository.findOne({
        where: { id: propertyId },
      });

      if (!property) {
        console.log("❌ Property not found");
        throw new NotFoundException("Property not found");
      }

      // Allow admins to manage any property, otherwise check ownership
      if (userRole !== "admin" && property.operator_id !== userId) {
        console.log(
          "❌ Access denied - user does not own property and is not admin"
        );
        console.log("- User role:", userRole);
        console.log("- Property operator_id:", property.operator_id);
        console.log("- User id:", userId);
        throw new ForbiddenException(
          "You can only upload media for your own properties"
        );
      }
      console.log("✅ Property access verified (admin or owner)");

      // Validate file type
      console.log("🔍 Validating file type...");
      if (!this.s3Service.isValidFileType(file.mimetype)) {
        console.log("❌ Invalid file type:", file.mimetype);
        throw new BadRequestException(
          "Invalid file type. Only images and videos are allowed."
        );
      }
      console.log("✅ File type valid");

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.log("❌ File too large:", file.size);
        throw new BadRequestException("File too large. Maximum size is 10MB.");
      }
      console.log("✅ File size OK");

      // Check media count limit (10 files per property)
      console.log("🔍 Checking media count...");
      const existingMediaCount = await this.propertyMediaRepository.count({
        where: { property_id: propertyId },
      });

      if (existingMediaCount >= 10) {
        console.log("❌ Too many media files:", existingMediaCount);
        throw new BadRequestException(
          "Maximum 10 media files per property allowed."
        );
      }
      console.log("✅ Media count OK:", existingMediaCount);

      // Generate unique file key
      console.log("🔧 Generating file key...");
      const fileKey = this.s3Service.generateFileKey(
        file.originalname,
        "property-media"
      );
      console.log("✅ File key generated:", fileKey);

      // Upload to S3
      console.log("🔧 Uploading to S3...");
      const s3Result = await this.s3Service.uploadFile(
        file.buffer,
        fileKey,
        file.mimetype,
        file.originalname
      );
      console.log("✅ S3 upload successful:", s3Result);

      // Get next order index if not provided
      if (orderIndex === undefined) {
        console.log("🔧 Getting next order index...");
        const maxOrderIndex = await this.propertyMediaRepository
          .createQueryBuilder("media")
          .select("MAX(media.order_index)", "maxOrder")
          .where("media.property_id = :propertyId", { propertyId })
          .getRawOne();

        orderIndex = (maxOrderIndex?.maxOrder || -1) + 1;
        console.log("✅ Order index set to:", orderIndex);
      }

      // If this is the first media file, make it featured
      if (existingMediaCount === 0) {
        isFeatured = true;
        console.log("✅ Set as featured (first media)");
      }

      // Create media record
      console.log("🔧 Creating media record...");
      const media = this.propertyMediaRepository.create({
        property_id: propertyId,
        url: s3Result.url,
        s3_key: s3Result.key,
        type: this.s3Service.getFileType(file.mimetype),
        mime_type: file.mimetype,
        original_filename: file.originalname,
        file_size: file.size,
        order_index: orderIndex,
        is_featured: isFeatured || false,
      });

      const savedMedia = await this.propertyMediaRepository.save(media);
      console.log("✅ Media record saved:", savedMedia.id);

      return savedMedia;
    } catch (error) {
      console.error("❌ Error in PropertyMediaService.uploadFile:", error);
      throw error;
    }
  }

  /**
   * Get all media for a property
   */
  async getPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
    return await this.propertyMediaRepository.find({
      where: { property_id: propertyId },
      order: { order_index: "ASC", created_at: "ASC" },
    });
  }

  /**
   * Delete media file
   */
  async deleteMedia(
    mediaId: string,
    userId: string,
    userRole?: string
  ): Promise<void> {
    const media = await this.propertyMediaRepository.findOne({
      where: { id: mediaId },
      relations: ["property"],
    });

    if (!media) {
      throw new NotFoundException("Media not found");
    }

    // Allow admins to delete any media, otherwise check ownership
    if (userRole !== "admin" && media.property.operator_id !== userId) {
      console.log(
        "❌ Delete access denied - user does not own property and is not admin"
      );
      console.log("- User role:", userRole);
      console.log("- Property operator_id:", media.property.operator_id);
      console.log("- User id:", userId);
      throw new ForbiddenException(
        "You can only delete media from your own properties"
      );
    }

    console.log("✅ Delete access verified (admin or owner)");

    // Delete from S3
    await this.s3Service.deleteFile(media.s3_key);

    // Delete from database
    await this.propertyMediaRepository.remove(media);
  }

  /**
   * Update media order
   */
  async updateMediaOrder(
    propertyId: string,
    userId: string,
    mediaOrders: { id: string; order_index: number }[],
    userRole?: string
  ): Promise<PropertyMedia[]> {
    // Verify property ownership
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    // Allow admins to update any property, otherwise check ownership
    if (userRole !== "admin" && property.operator_id !== userId) {
      console.log(
        "❌ Update order access denied - user does not own property and is not admin"
      );
      console.log("- User role:", userRole);
      console.log("- Property operator_id:", property.operator_id);
      console.log("- User id:", userId);
      throw new ForbiddenException(
        "You can only update media for your own properties"
      );
    }

    console.log("✅ Update order access verified (admin or owner)");

    // Update order for each media
    for (const mediaOrder of mediaOrders) {
      await this.propertyMediaRepository.update(
        { id: mediaOrder.id, property_id: propertyId },
        { order_index: mediaOrder.order_index }
      );
    }

    return await this.getPropertyMedia(propertyId);
  }

  /**
   * Set featured media
   */
  async setFeaturedMedia(
    mediaId: string,
    userId: string,
    userRole?: string
  ): Promise<PropertyMedia> {
    const media = await this.propertyMediaRepository.findOne({
      where: { id: mediaId },
      relations: ["property"],
    });

    if (!media) {
      throw new NotFoundException("Media not found");
    }

    // Allow admins to update any property, otherwise check ownership
    if (userRole !== "admin" && media.property.operator_id !== userId) {
      console.log(
        "❌ Set featured access denied - user does not own property and is not admin"
      );
      console.log("- User role:", userRole);
      console.log("- Property operator_id:", media.property.operator_id);
      console.log("- User id:", userId);
      throw new ForbiddenException(
        "You can only update media for your own properties"
      );
    }

    console.log("✅ Set featured access verified (admin or owner)");

    // Remove featured status from all media for this property
    await this.propertyMediaRepository.update(
      { property_id: media.property_id },
      { is_featured: false }
    );

    // Set this media as featured
    media.is_featured = true;
    return await this.propertyMediaRepository.save(media);
  }
}
