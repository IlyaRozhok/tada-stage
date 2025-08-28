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

@Entity("preferences")
export class Preferences {
  @ApiProperty({ description: "Unique preferences identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "User ID who owns these preferences" })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "Primary postcode for location search",
    example: "SW1A 1AA",
  })
  @Column({ nullable: true })
  primary_postcode: string;

  @ApiProperty({
    description: "Secondary location preference",
    example: "kings-cross-st-pancras",
    enum: [
      "kings-cross-st-pancras",
      "oxford-circus",
      "liverpool-street",
      "paddington",
      "waterloo",
      "victoria",
      "green-park",
      "bond-street",
      "baker-street",
      "canary-wharf",
      "london-bridge",
      "tottenham-court-road",
      "leicester-square",
      "piccadilly-circus",
      "euston",
      "no-preference",
    ],
  })
  @Column({ nullable: true })
  secondary_location: string;

  @ApiProperty({
    description: "Location to commute to",
    example: "canary-wharf",
    enum: [
      "canary-wharf",
      "city-of-london",
      "westminster",
      "shoreditch",
      "kings-cross",
      "paddington",
      "south-bank",
      "mayfair",
      "holborn",
      "clerkenwell",
      "bermondsey",
      "stratford",
      "hammersmith",
      "croydon",
      "central-london",
      "no-preference",
    ],
  })
  @Column({ nullable: true })
  commute_location: string;

  @ApiProperty({
    description: "Maximum walking commute time in minutes",
    example: 15,
  })
  @Column({ type: "int", nullable: true })
  commute_time_walk: number;

  @ApiProperty({
    description: "Maximum cycling commute time in minutes",
    example: 20,
  })
  @Column({ type: "int", nullable: true })
  commute_time_cycle: number;

  @ApiProperty({
    description: "Maximum tube commute time in minutes",
    example: 30,
  })
  @Column({ type: "int", nullable: true })
  commute_time_tube: number;

  @ApiProperty({ description: "Preferred move-in date", example: "2024-03-01" })
  @Column({ type: "date", nullable: true })
  move_in_date: Date;

  @ApiProperty({
    description: "Preferred move-out date",
    example: "2024-09-01",
  })
  @Column({ type: "date", nullable: true })
  move_out_date: Date;

  @ApiProperty({ description: "Minimum rent price per month", example: 1500 })
  @Column({ type: "int", nullable: true })
  min_price: number;

  @ApiProperty({ description: "Maximum rent price per month", example: 3000 })
  @Column({ type: "int", nullable: true })
  max_price: number;

  @ApiProperty({
    description: "Minimum number of bedrooms required",
    example: 2,
  })
  @Column({ type: "int", nullable: true })
  min_bedrooms: number;

  @ApiProperty({
    description: "Maximum number of bedrooms required",
    example: 4,
  })
  @Column({ type: "int", nullable: true })
  max_bedrooms: number;

  @ApiProperty({
    description: "Minimum number of bathrooms required",
    example: 1,
  })
  @Column({ type: "int", nullable: true })
  min_bathrooms: number;

  @ApiProperty({
    description: "Maximum number of bathrooms required",
    example: 3,
  })
  @Column({ type: "int", nullable: true })
  max_bathrooms: number;

  @ApiProperty({
    description: "Furnishing preference",
    example: "furnished",
    enum: ["furnished", "unfurnished", "part-furnished", "no-preference"],
  })
  @Column({ nullable: true })
  furnishing: string;

  @ApiProperty({
    description: "Preferred let duration",
    example: "12-months",
    enum: ["6-months", "12-months", "18-months", "24-months", "flexible"],
  })
  @Column({ nullable: true })
  let_duration: string;

  @ApiProperty({
    description: "Preferred property types",
    example: ["flats", "houses"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  property_type: string[];

  @ApiProperty({
    description: "Building style preferences",
    example: ["btr", "co-living", "new-builds"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  building_style: string[];

  @ApiProperty({
    description: "Designer furniture preference",
    example: true,
  })
  @Column({ type: "boolean", nullable: true })
  designer_furniture: boolean;

  @ApiProperty({
    description: "House shares preference",
    example: "show-all",
    enum: ["show-all", "only-house-shares", "no-house-shares"],
  })
  @Column({ nullable: true })
  house_shares: string;

  @ApiProperty({
    description: "Date property was added filter",
    example: "last-7-days",
    enum: [
      "any",
      "last-24-hours",
      "last-3-days",
      "last-14-days",
      "last-21-days",
    ],
  })
  @Column({ nullable: true })
  date_property_added: string;

  @ApiProperty({
    description: "Lifestyle features preferences",
    example: ["gym", "pool", "garden"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  lifestyle_features: string[];

  @ApiProperty({
    description: "Social features preferences",
    example: ["communal-space", "rooftop", "events"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  social_features: string[];

  @ApiProperty({
    description: "Work features preferences",
    example: ["co-working", "meeting-rooms", "high-speed-wifi"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  work_features: string[];

  @ApiProperty({
    description: "Convenience features preferences",
    example: ["parking", "storage", "laundry"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  convenience_features: string[];

  @ApiProperty({
    description: "Pet-friendly features preferences",
    example: ["pet-park", "pet-washing", "pet-sitting"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  pet_friendly_features: string[];

  @ApiProperty({
    description: "Luxury features preferences",
    example: ["concierge", "spa", "cinema"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  luxury_features: string[];

  @ApiProperty({
    description: "User's hobbies and interests",
    example: ["Reading", "Cooking", "Fitness"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  hobbies: string[];

  @ApiProperty({
    description: "Ideal living environment preferences (array)",
    example: ["quiet-professional", "social-friendly"],
    type: [String],
    enum: [
      "quiet-professional",
      "social-friendly",
      "family-oriented",
      "student-lifestyle",
      "creative-artistic",
    ],
  })
  @Column({ type: "json", nullable: true })
  ideal_living_environment: string[];

  @ApiProperty({
    description: "Pet ownership information",
    example: "none",
    enum: ["none", "dog", "cat", "small-pets", "planning-to-get"],
  })
  @Column({ nullable: true })
  pets: string;

  @ApiProperty({
    description: "Smoking preference",
    example: "no",
    enum: [
      "no",
      "yes",
      "no-but-okay",
      "no-prefer-non-smoking",
      "no-preference",
    ],
  })
  @Column({ nullable: true })
  smoker: string;

  @ApiProperty({
    description: "Additional information about the user",
    example: "I'm a quiet professional who enjoys cooking and reading.",
  })
  @Column({ type: "text", nullable: true })
  additional_info: string;

  @ApiProperty({ description: "Preferences creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Preferences last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.preferences)
  @JoinColumn({ name: "user_id" })
  user: User;
}
