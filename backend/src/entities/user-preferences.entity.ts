import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";

@Entity("user_preferences")
export class UserPreferences {
  @ApiProperty({ description: "Unique preferences identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "User ID who owns these preferences" })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "Minimum price preference",
    example: 1000,
  })
  @Column({ type: "int", nullable: true })
  min_price: number;

  @ApiProperty({
    description: "Maximum price preference",
    example: 3000,
  })
  @Column({ type: "int", nullable: true })
  max_price: number;

  @ApiProperty({
    description: "Minimum number of bedrooms",
    example: 1,
  })
  @Column({ type: "int", nullable: true })
  min_bedrooms: number;

  @ApiProperty({
    description: "Maximum number of bedrooms",
    example: 3,
  })
  @Column({ type: "int", nullable: true })
  max_bedrooms: number;

  @ApiProperty({
    description: "Preferred property type",
    example: "apartment",
    enum: ["apartment", "studio", "house", "flat", "any"],
  })
  @Column({ nullable: true })
  property_type: string;

  @ApiProperty({
    description: "Preferred furnishing type",
    example: "furnished",
    enum: ["furnished", "unfurnished", "part-furnished", "any"],
  })
  @Column({ nullable: true })
  furnishing: string;

  @ApiProperty({
    description: "Preferred lifestyle features",
    example: ["gym", "pool", "concierge"],
    type: [String],
  })
  @Column("text", { array: true, nullable: true })
  lifestyle_features: string[];

  @ApiProperty({
    description: "Move-in date preference",
    example: "2024-03-01",
  })
  @Column({ type: "date", nullable: true })
  move_in_date: Date;

  @ApiProperty({
    description: "Move-out date preference",
    example: "2024-06-01",
  })
  @Column({ type: "date", nullable: true })
  move_out_date: Date;

  @ApiProperty({ description: "Preferences creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Preferences last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
