import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsIn,
  IsArray,
  IsBoolean,
  IsEmail,
  IsDateString,
} from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "Full name of the user",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({
    description: "User email address",
    example: "user@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "User phone number",
    example: "+44 7700 900123",
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: "User date of birth",
    example: "1990-01-15",
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({
    description: "User nationality",
    example: "British",
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    description: "Age range of the user",
    example: "25-34",
    enum: ["under-25", "25-34", "35-44", "45-54", "55+"],
  })
  @IsOptional()
  @IsIn(["under-25", "25-34", "35-44", "45-54", "55+"])
  age_range?: string;

  @ApiPropertyOptional({
    description: "User occupation",
    example: "Software Engineer",
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({
    description: "Industry the user works in",
    example: "Technology",
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: "Work style preference",
    example: "Hybrid",
    enum: ["Office", "Remote", "Hybrid", "Freelance"],
  })
  @IsOptional()
  @IsIn(["Office", "Remote", "Hybrid", "Freelance"])
  work_style?: string;

  @ApiPropertyOptional({
    description: "Lifestyle preferences as array of strings",
    example: ["social", "quiet", "active"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifestyle?: string[];

  @ApiPropertyOptional({
    description: "Pet ownership information",
    example: "cat",
    enum: ["none", "cat", "dog", "other"],
  })
  @IsOptional()
  @IsIn(["none", "cat", "dog", "other"])
  pets?: string;

  @ApiPropertyOptional({
    description: "Whether the user smokes",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  smoker?: boolean;

  @ApiPropertyOptional({
    description: "User's hobbies and lifestyle preferences",
    example: ["gym", "cooking", "socialising"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];

  @ApiPropertyOptional({
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
  @IsOptional()
  @IsIn([
    "social",
    "quiet",
    "family-friendly",
    "pet-friendly",
    "trendy",
    "green",
  ])
  ideal_living_environment?: string;

  @ApiPropertyOptional({
    description: "Additional information for landlords",
    example: "I'm a quiet professional who loves cooking",
  })
  @IsOptional()
  @IsString()
  additional_info?: string;

  @ApiPropertyOptional({
    description: "Account status",
    example: "active",
    enum: ["active", "inactive", "suspended"],
  })
  @IsOptional()
  @IsIn(["active", "inactive", "suspended"])
  status?: string;

  // Operator-specific fields
  @ApiPropertyOptional({
    description: "Company name (for operators)",
    example: "Smith Properties Ltd",
  })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiPropertyOptional({
    description: "Business address (for operators)",
    example: "123 Business St, London",
  })
  @IsOptional()
  @IsString()
  business_address?: string;

  @ApiPropertyOptional({
    description: "Business description (for operators)",
    example: "We specialize in luxury residential properties",
  })
  @IsOptional()
  @IsString()
  business_description?: string;
}
