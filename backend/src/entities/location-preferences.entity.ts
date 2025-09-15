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

@Entity("location_preferences")
export class LocationPreferences {
  @ApiProperty({ description: "Unique location preferences identifier" })
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

  @ApiProperty({
    description: "Preferred areas",
    example: ["central-london", "shoreditch", "canary-wharf"],
    type: [String],
  })
  @Column("text", { array: true, nullable: true })
  preferred_areas: string[];

  @ApiProperty({
    description: "Excluded areas",
    example: ["croydon", "stratford"],
    type: [String],
  })
  @Column("text", { array: true, nullable: true })
  excluded_areas: string[];

  @ApiProperty({ description: "Location preferences creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Location preferences last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
