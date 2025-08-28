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

@Entity("operator_profiles")
export class OperatorProfile {
  @ApiProperty({ description: "Unique operator profile identifier" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "Full name of the operator",
    example: "John Smith",
  })
  @Column({ nullable: true })
  full_name: string;

  @ApiProperty({ description: "Company name", example: "Smith Properties Ltd" })
  @Column({ nullable: true })
  company_name: string;

  @ApiProperty({
    description: "Operator phone number",
    example: "+44 7700 900123",
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({
    description: "Operator date of birth",
    example: "1990-01-15",
  })
  @Column({ type: "date", nullable: true })
  date_of_birth: Date;

  @ApiProperty({ description: "Operator nationality", example: "British" })
  @Column({ nullable: true })
  nationality: string;

  @ApiProperty({
    description: "Business address",
    example: "123 Business St, London",
  })
  @Column({ nullable: true })
  business_address: string;

  @ApiProperty({
    description: "Company registration number",
    example: "12345678",
  })
  @Column({ nullable: true })
  company_registration: string;

  @ApiProperty({ description: "VAT number", example: "GB123456789" })
  @Column({ nullable: true })
  vat_number: string;

  @ApiProperty({
    description: "Professional license number",
    example: "LIC123456",
  })
  @Column({ nullable: true })
  license_number: string;

  @ApiProperty({
    description: "Years of experience in property management",
    example: 5,
  })
  @Column({ type: "int", nullable: true })
  years_experience: number;

  @ApiProperty({
    description: "Areas of operation",
    example: ["Central London", "East London"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  operating_areas: string[];

  @ApiProperty({
    description: "Types of properties managed",
    example: ["Residential", "Commercial"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  property_types: string[];

  @ApiProperty({
    description: "Services offered",
    example: ["Property Management", "Lettings", "Sales"],
    type: [String],
  })
  @Column("simple-array", { nullable: true })
  services: string[];

  @ApiProperty({
    description: "Business description",
    example: "We specialize in luxury residential properties in Central London",
  })
  @Column({ type: "text", nullable: true })
  business_description: string;

  @ApiProperty({
    description: "Website URL",
    example: "https://smithproperties.com",
  })
  @Column({ nullable: true })
  website: string;

  @ApiProperty({
    description: "LinkedIn profile URL",
    example: "https://linkedin.com/in/johnsmith",
  })
  @Column({ nullable: true })
  linkedin: string;

  @ApiProperty({ description: "Profile creation date" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: "Profile last update date" })
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.operatorProfile)
  @JoinColumn()
  user: User;

  @Column({ type: "uuid", nullable: true })
  userId: string;
}
