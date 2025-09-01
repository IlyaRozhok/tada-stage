import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";

@Entity("tenant_profiles")
export class TenantProfile {
  @ApiProperty({ description: "Unique tenant profile identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "Full name of the tenant", example: "John Doe" })
  @Column({ nullable: true })
  full_name: string;

  @ApiProperty({
    description: "Age range of the tenant",
    example: "25-34",
    enum: ["under-25", "25-34", "35-44", "45-54", "55+"],
  })
  @Column({ nullable: true })
  age_range: string;

  @ApiProperty({
    description: "Tenant phone number",
    example: "+44 7700 900123",
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ description: "Tenant date of birth", example: "1990-01-15" })
  @Column({ type: "date", nullable: true })
  date_of_birth: Date;

  @ApiProperty({ description: "Tenant nationality", example: "British" })
  @Column({ nullable: true })
  nationality: string;

  @ApiProperty({
    description: "Tenant occupation",
    example: "Software Engineer",
  })
  @Column({ nullable: true })
  occupation: string;

  @ApiProperty({
    description: "Industry the tenant works in",
    example: "Technology",
  })
  @Column({ nullable: true })
  industry: string;

  @ApiProperty({
    description: "Work style preference",
    example: "Hybrid",
    enum: ["Office", "Remote", "Hybrid", "Freelance"],
  })
  @Column({ nullable: true })
  work_style: string;

  @ApiProperty({
    description: "Lifestyle preferences as array of strings",
    example: ["Active", "Social", "Quiet"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  lifestyle: string[];

  @ApiProperty({
    description: "Ideal living environment preference",
    example: "social",
    enum: [
      "social",
      "quiet",
      "family-friendly",
      "pet-friendly",
      "trendy",
      "green",
    ],
  })
  @Column({ nullable: true })
  ideal_living_environment: string;

  @ApiProperty({
    description: "Additional information for landlords",
    example: "I'm a quiet professional who loves cooking",
  })
  @Column({ type: "text", nullable: true })
  additional_info: string;

  @ApiProperty({
    description: "Shortlisted property IDs",
    example: ["property-id-1", "property-id-2"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  shortlisted_properties: string[];

  @ApiProperty({ description: "Profile creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Profile last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.tenantProfile)
  @JoinColumn()
  user: User;

  @Column({ type: "uuid", nullable: true })
  userId: string;

  // Computed properties for backward compatibility - get from preferences
  get pets(): string | null {
    return this.user?.preferences?.pets || null;
  }

  get smoker(): boolean {
    const smokerPref = this.user?.preferences?.smoker;
    return smokerPref === "yes" || smokerPref === "true";
  }

  get hobbies(): string[] {
    return this.user?.preferences?.hobbies || [];
  }
}
