import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Preferences } from "./preferences.entity";
import { TenantProfile } from "./tenant-profile.entity";
import { OperatorProfile } from "./operator-profile.entity";
import { Shortlist } from "./shortlist.entity";

export enum UserRole {
  Admin = "admin",
  Operator = "operator",
  Tenant = "tenant",
}

export enum UserStatus {
  Active = "active",
  Inactive = "inactive",
  Suspended = "suspended",
}

@Entity("users")
export class User {
  @ApiProperty({ description: "Unique user identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @Column({ unique: true })
  @Index()
  email: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  password: string;

  @ApiProperty({
    description: "Primary user role",
    example: "tenant",
    enum: UserRole,
  })
  @Column({
    type: "enum",
    enum: UserRole,
    nullable: true,
  })
  role: UserRole;

  @ApiProperty({
    description: "User account status",
    example: "active",
    enum: UserStatus,
  })
  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.Active,
  })
  status: UserStatus;

  @ApiProperty({
    description: "User full name",
    example: "John Doe",
  })
  @Column({ nullable: true })
  full_name: string;

  @ApiProperty({
    description: "Authentication provider",
    example: "local",
    enum: ["local", "google"],
  })
  @Column({ default: "local" })
  provider: string;

  @ApiProperty({
    description: "Google ID for OAuth users",
    example: "123456789012345678901",
  })
  @Column({ nullable: true })
  google_id: string;

  @ApiProperty({
    description: "User avatar URL",
    example: "https://example.com/avatar.jpg",
  })
  @Column({ nullable: true })
  avatar_url: string;

  @ApiProperty({
    description: "Whether email is verified",
    example: true,
  })
  @Column({ default: false })
  email_verified: boolean;

  @ApiProperty({ description: "User creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "User last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => Preferences, (preferences) => preferences.user, {
    cascade: true,
  })
  preferences: Preferences;

  @OneToOne(() => TenantProfile, (tenantProfile) => tenantProfile.user, {
    cascade: true,
  })
  tenantProfile: TenantProfile;

  @OneToOne(() => OperatorProfile, (operatorProfile) => operatorProfile.user, {
    cascade: true,
  })
  operatorProfile: OperatorProfile;

  @OneToMany(() => Shortlist, (shortlist) => shortlist.user)
  shortlists: Shortlist[];

  // Computed property for backward compatibility
  get roles(): string[] {
    return [this.role];
  }
}
