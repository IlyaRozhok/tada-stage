import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private keyPrefix: string;

  constructor(private configService: ConfigService) {

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    const region = this.configService.get<string>("AWS_REGION") || "eu-north-1";
    const bucketName =
      this.configService.get<string>("AWS_S3_BUCKET_NAME") ||
      "tada-media-bucket-local";

    if (!accessKeyId || !secretAccessKey) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "⚠️ Missing AWS credentials, S3Service will be disabled (dev mode)"
        );
        this.s3Client = null as any;
        this.bucketName = bucketName;
        this.keyPrefix = "tada-media/";
        return;
      } else {
        console.error("❌ Missing AWS credentials from ConfigService");
        throw new Error("AWS credentials not configured in ConfigService");
      }
    }

    // Принудительно создаем S3Client с кредами из ConfigService
    this.s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      // Принудительно отключаем поиск credentials в других местах
      forcePathStyle: false,
    });

    this.bucketName = bucketName;
    this.keyPrefix = "tada-media/";

    console.log(
      `🔧 S3Service initialized with ConfigService credentials: bucket=${this.bucketName}, region=${region}, prefix=${this.keyPrefix}`
    );
  }

  /**
   * Upload file to S3 and return a presigned URL
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
    originalFilename: string
  ): Promise<S3UploadResult> {


    try {
      // Add prefix to key
      const fullKey = `${this.keyPrefix}${key}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          originalFilename,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);
      console.log("✅ S3 upload successful");

      // Generate presigned URL for secure access
      const url = await this.getPresignedUrl(fullKey);

      return {
        url,
        key: fullKey,
      };
    } catch (error) {
      console.error("❌ Error in S3Service.uploadFile:", error);
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate presigned URL for secure access
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate unique file key with prefix
   */
  generateFileKey(originalFilename: string, prefix: string = "media"): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = originalFilename.split(".").pop();
    return `${prefix}/${timestamp}-${randomStr}.${extension}`;
  }

  /**
   * Validate file type
   */
  isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",

      // Videos
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo", // .avi
      "video/x-ms-wmv", // .wmv
    ];

    return allowedTypes.includes(mimeType);
  }

  /**
   * Get file type from MIME type
   */
  getFileType(mimeType: string): "image" | "video" {
    return mimeType.startsWith("image/") ? "image" : "video";
  }
}
