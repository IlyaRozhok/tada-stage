import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { PropertyMedia } from "./property-media.entity";

@Entity("properties")
export class Property {
  @ApiProperty({ description: "Unique property identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "Property title",
    example: "Luxury 2-bed flat in Central London",
  })
  @Column()
  title: string;

  @ApiProperty({
    description: "Property description",
    example: "Beautiful modern apartment with stunning city views",
  })
  @Column("text")
  description: string;

  @ApiProperty({
    description: "Property address",
    example: "123 Oxford Street, London W1D 2HX",
  })
  @Column()
  address: string;

  @ApiProperty({ description: "Monthly rent price", example: 2500 })
  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: "Number of bedrooms", example: 2 })
  @Column("int")
  bedrooms: number;

  @ApiProperty({ description: "Number of bathrooms", example: 2 })
  @Column("int")
  bathrooms: number;

  @ApiProperty({ description: "Property type", example: "apartment" })
  @Column()
  property_type: string;

  @ApiProperty({
    description: "Furnishing type",
    example: "furnished",
    enum: ["furnished", "unfurnished", "part-furnished"],
  })
  @Column()
  furnishing: string;

  @ApiProperty({
    description: "Lifestyle features",
    example: ["gym", "pool", "concierge"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  lifestyle_features: string[];

  @ApiProperty({ description: "Available from date", example: "2024-03-01" })
  @Column("date")
  available_from: Date;

  @ApiProperty({
    description: "Property images URLs",
    example: ["/uploads/property1.jpg", "/uploads/property2.jpg"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  images: string[];

  @ApiProperty({ description: "Is Build-to-Rent property", example: true })
  @Column("boolean", { default: false })
  is_btr: boolean;

  @ApiProperty({ description: "Property operator/landlord ID" })
  @Column("uuid")
  operator_id: string;

  @ApiProperty({ description: "Property creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Property last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "operator_id" })
  operator: User;

  @OneToMany(() => PropertyMedia, (media) => media.property)
  media: PropertyMedia[];
}
