import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
} from "class-validator";

export class CreateUserDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn(["admin", "operator", "tenant"])
  role?: string = "tenant";
}
