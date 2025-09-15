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

@Entity("lifestyle_preferences")
export class LifestylePreferences {
  @ApiProperty({ description: "Unique lifestyle preferences identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "User ID who owns these preferences" })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "Work arrangement preference",
    example: "hybrid",
    enum: ["remote", "hybrid", "office", "any"],
  })
  @Column({ nullable: true })
  work_arrangement: string;

  @ApiProperty({
    description: "Work style preference",
    example: "collaborative",
    enum: ["collaborative", "independent", "mixed", "any"],
  })
  @Column({ nullable: true })
  work_style: string;

  @ApiProperty({
    description: "Social lifestyle preference",
    example: "outgoing",
    enum: ["outgoing", "quiet", "balanced", "any"],
  })
  @Column({ nullable: true })
  social_lifestyle: string;

  @ApiProperty({
    description: "Noise tolerance level",
    example: "low",
    enum: ["low", "medium", "high", "any"],
  })
  @Column({ nullable: true })
  noise_tolerance: string;

  @ApiProperty({
    description: "Pet ownership preference",
    example: true,
  })
  @Column({ type: "boolean", nullable: true })
  pets_allowed: boolean;

  @ApiProperty({
    description: "Smoking preference",
    example: false,
  })
  @Column({ type: "boolean", nullable: true })
  smoking_allowed: boolean;

  @ApiProperty({
    description: "Hobbies and interests",
    example: ["gym", "reading", "cooking"],
    type: [String],
  })
  @Column("text", { array: true, nullable: true })
  hobbies: string[];

  @ApiProperty({
    description: "Preferred amenities",
    example: ["gym", "pool", "garden", "parking"],
    type: [String],
  })
  @Column("text", { array: true, nullable: true })
  preferred_amenities: string[];

  @ApiProperty({
    description: "Community preferences",
    example: ["young-professionals", "families", "students"],
    type: [String],
  })
  @Column("text", { array: true, nullable: true })
  community_preferences: string[];

  @ApiProperty({
    description: "Additional lifestyle notes",
    example: "Prefer quiet neighborhood with good transport links",
  })
  @Column({ type: "text", nullable: true })
  additional_notes: string;

  @ApiProperty({ description: "Lifestyle preferences creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Lifestyle preferences last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
