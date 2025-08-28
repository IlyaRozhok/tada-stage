import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Property } from "./property.entity";
import { Exclude } from "class-transformer";

@Entity("property_media")
export class PropertyMedia {
  @ApiProperty({ description: "Unique media identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "Property ID this media belongs to" })
  @Column("uuid")
  property_id: string;

  @ApiProperty({
    description: "Media file URL (presigned)",
    example:
      "https://your-bucket.s3.amazonaws.com/media/123456789-image.jpg?X-Amz-Algorithm=...",
  })
  @Column()
  url: string;

  @ApiProperty({
    description: "S3 object key for deletion",
    example: "media/123456789-image.jpg",
  })
  @Column()
  @Exclude() // Исключаем из сериализации для безопасности
  s3_key: string;

  @ApiProperty({
    description: "Media type",
    example: "image",
    enum: ["image", "video"],
  })
  @Column({ default: "image" })
  type: "image" | "video";

  @ApiProperty({
    description: "Media file MIME type",
    example: "image/jpeg",
  })
  @Column()
  mime_type: string;

  @ApiProperty({
    description: "Original filename",
    example: "apartment-living-room.jpg",
  })
  @Column()
  original_filename: string;

  @ApiProperty({
    description: "File size in bytes",
    example: 1024000,
  })
  @Column("bigint")
  file_size: number;

  @ApiProperty({
    description: "Display order index",
    example: 0,
  })
  @Column("int", { default: 0 })
  order_index: number;

  @ApiProperty({
    description: "Is this the main/featured image",
    example: true,
  })
  @Column("boolean", { default: false })
  is_featured: boolean;

  @ApiProperty({ description: "Media creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Media last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Property, (property) => property.media, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "property_id" })
  property: Property;
}
 