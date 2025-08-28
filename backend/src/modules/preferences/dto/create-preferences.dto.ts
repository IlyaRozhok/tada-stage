import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsIn,
  IsArray,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePreferencesDto {
  @ApiPropertyOptional({
    description: "Primary postcode for location search",
    example: "SW1A 1AA",
  })
  @IsOptional()
  @IsString()
  primary_postcode?: string;

  @ApiPropertyOptional({
    description: "Secondary location preference",
    example: "Central London",
  })
  @IsOptional()
  @IsString()
  secondary_location?: string;

  @ApiPropertyOptional({
    description: "Location to commute to",
    example: "Canary Wharf",
  })
  @IsOptional()
  @IsString()
  commute_location?: string;

  @ApiPropertyOptional({
    description: "Maximum walking commute time in minutes",
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  commute_time_walk?: number;

  @ApiPropertyOptional({
    description: "Maximum cycling commute time in minutes",
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  commute_time_cycle?: number;

  @ApiPropertyOptional({
    description: "Maximum tube commute time in minutes",
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  commute_time_tube?: number;

  @ApiPropertyOptional({
    description: "Preferred move-in date",
    example: "2024-03-01",
  })
  @IsOptional()
  @IsDateString()
  move_in_date?: string;

  @ApiPropertyOptional({
    description: "Minimum rent price per month",
    example: 1500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({
    description: "Maximum rent price per month",
    example: 3000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({
    description: "Minimum number of bedrooms required",
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  min_bedrooms?: number;

  @ApiPropertyOptional({
    description: "Maximum number of bedrooms required",
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  max_bedrooms?: number;

  @ApiPropertyOptional({
    description: "Minimum number of bathrooms required",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  min_bathrooms?: number;

  @ApiPropertyOptional({
    description: "Maximum number of bathrooms required",
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  max_bathrooms?: number;

  @ApiPropertyOptional({
    description: "Furnishing preference",
    example: "furnished",
    enum: ["furnished", "unfurnished", "part-furnished"],
  })
  @IsOptional()
  @IsIn(["furnished", "unfurnished", "part-furnished", "", null])
  furnishing?: string;

  @ApiPropertyOptional({
    description: "Preferred let duration",
    example: "12-months",
    enum: ["6-months", "12-months", "18-months", "24-months", "flexible"],
  })
  @IsOptional()
  @IsIn([
    "6-months",
    "12-months",
    "18-months",
    "24-months",
    "flexible",
    "",
    null,
  ])
  let_duration?: string;

  @ApiPropertyOptional({
    description: "Preferred property type",
    example: "flats",
    enum: ["any", "flats", "houses", "studio", "others"],
  })
  @IsOptional()
  @IsIn(["any", "flats", "houses", "studio", "others", "", null])
  property_type?: string;

  @ApiPropertyOptional({
    description: "Building style preferences",
    example: ["btr", "co-living", "new-builds"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  building_style?: string[];

  @ApiPropertyOptional({
    description: "Designer furniture preference",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  designer_furniture?: boolean;

  @ApiPropertyOptional({
    description: "House shares preference",
    example: "show-all",
    enum: ["show-all", "only-house-shares", "no-house-shares"],
  })
  @IsOptional()
  @IsIn(["show-all", "only-house-shares", "no-house-shares", "", null])
  house_shares?: string;

  @ApiPropertyOptional({
    description: "Date property was added filter",
    example: "any",
    enum: [
      "any",
      "last-24-hours",
      "last-3-days",
      "last-14-days",
      "last-21-days",
    ],
  })
  @IsOptional()
  @IsIn([
    "any",
    "last-24-hours",
    "last-3-days",
    "last-14-days",
    "last-21-days",
    "",
    null,
  ])
  date_property_added?: string;

  @ApiPropertyOptional({
    description: "Lifestyle features preferences",
    example: ["gym", "pool", "garden"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifestyle_features?: string[];

  @ApiPropertyOptional({
    description: "Social features preferences",
    example: ["communal-space", "rooftop", "events"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  social_features?: string[];

  @ApiPropertyOptional({
    description: "Work features preferences",
    example: ["co-working", "meeting-rooms", "high-speed-wifi"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  work_features?: string[];

  @ApiPropertyOptional({
    description: "Convenience features preferences",
    example: ["parking", "storage", "laundry"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  convenience_features?: string[];

  @ApiPropertyOptional({
    description: "Pet-friendly features preferences",
    example: ["pet-park", "pet-washing", "pet-sitting"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pet_friendly_features?: string[];

  @ApiPropertyOptional({
    description: "Luxury features preferences",
    example: ["concierge", "spa", "cinema"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  luxury_features?: string[];

  @ApiPropertyOptional({
    description: "User's hobbies and interests",
    example: ["Reading", "Cooking", "Fitness"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];

  @ApiPropertyOptional({
    description: "Ideal living environment preference",
    example: "quiet-professional",
    enum: [
      "quiet-professional",
      "social-friendly",
      "family-oriented",
      "student-lifestyle",
      "creative-artistic",
      "no-preference",
    ],
  })
  @IsOptional()
  @IsIn([
    "quiet-professional",
    "social-friendly",
    "family-oriented",
    "student-lifestyle",
    "creative-artistic",
    "no-preference",
    "",
    null,
  ])
  ideal_living_environment?: string;

  @ApiPropertyOptional({
    description: "Pet ownership information",
    example: "none",
    enum: ["none", "dog", "cat", "small-pets", "planning-to-get"],
  })
  @IsOptional()
  @IsIn(["none", "dog", "cat", "small-pets", "planning-to-get", "", null])
  pets?: string;

  @ApiPropertyOptional({
    description: "Whether the user is a smoker",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  smoker?: boolean;

  @ApiPropertyOptional({
    description: "Additional information about the user",
    example: "I'm a quiet professional who enjoys cooking and reading.",
  })
  @IsOptional()
  @IsString()
  additional_info?: string;
}
