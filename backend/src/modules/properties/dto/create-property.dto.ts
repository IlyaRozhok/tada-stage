import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  IsDateString,
  IsOptional,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class CreatePropertyDto {
  @ApiProperty({
    description: "Property title",
    example: "Luxury 2-bed flat in Central London",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Property description",
    example: "Beautiful modern apartment with stunning city views",
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: "Property address",
    example: "123 Oxford Street, London W1D 2HX",
  })
  @IsString()
  address: string;

  @ApiProperty({ description: "Monthly rent price", example: 2500 })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: "Number of bedrooms", example: 2 })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const num = parseInt(value, 10);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsInt()
  @Min(0)
  bedrooms: number;

  @ApiProperty({ description: "Number of bathrooms", example: 2 })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      const num = parseInt(value, 10);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsInt()
  @Min(0)
  bathrooms: number;

  @ApiProperty({ description: "Property type", example: "apartment" })
  @IsString()
  property_type: string;

  @ApiProperty({
    description: "Furnishing type",
    example: "furnished",
    enum: ["furnished", "unfurnished", "part-furnished"],
  })
  @IsString()
  furnishing: string;

  @ApiProperty({
    description: "Operator ID (for admins only)",
    example: "uuid-string",
    required: false,
  })
  @IsOptional()
  @IsString()
  operator_id?: string;

  @ApiProperty({
    description: "Lifestyle features",
    example: ["gym", "pool", "concierge"],
    type: [String],
    required: false,
  })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      // If it's a single string, convert to array
      return [value];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lifestyle_features?: string[];

  @ApiProperty({ description: "Available from date", example: "2024-03-01" })
  @IsDateString()
  available_from: string;

  @ApiProperty({
    description: "Property images URLs",
    example: ["/uploads/property1.jpg", "/uploads/property2.jpg"],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: "Is Build-to-Rent property",
    example: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value === "true" || value === "1";
    }
    return Boolean(value);
  })
  @IsBoolean()
  @IsOptional()
  is_btr?: boolean;
}
