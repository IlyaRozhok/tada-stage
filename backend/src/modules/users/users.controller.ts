import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
  Query,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "../../entities/user.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { CreateUserDto } from "./dto/create-user.dto";

class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags("Users")
@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    type: User,
  })
  async getProfile(@Req() req: any): Promise<User> {
    return this.usersService.findOne(req.user.id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile updated successfully",
    type: User,
  })
  async updateProfile(
    @Req() req: any,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete current user account" })
  @ApiResponse({
    status: 200,
    description: "User account deleted successfully",
  })
  async deleteAccount(@Req() req: any): Promise<{ message: string }> {
    await this.usersService.deleteAccount(req.user.id);
    return { message: "Account deleted successfully" };
  }

  @Get("")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get all users (admin only)" })
  @ApiResponse({ status: 200, description: "List of users", type: [User] })
  async getAllUsers(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("search") search?: string,
    @Query("sortBy") sortBy = "created_at",
    @Query("order") order: "ASC" | "DESC" = "DESC"
  ) {
    return this.usersService.findAllPaginated({
      page,
      limit,
      search,
      sortBy,
      order,
    });
  }

  @Post("")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create user (admin only)" })
  @ApiResponse({ status: 201, description: "User created", type: User })
  async adminCreateUser(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.adminCreateUser(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update user by id (admin only)" })
  @ApiResponse({ status: 200, description: "User updated", type: User })
  async adminUpdateUser(
    @Param("id") id: string,
    @Body() dto: AdminUpdateUserDto
  ): Promise<User> {
    return this.usersService.adminUpdateUser(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete user by id (admin only)" })
  @ApiResponse({ status: 200, description: "User deleted" })
  async adminDeleteUser(@Param("id") id: string): Promise<{ message: string }> {
    await this.usersService.adminDeleteUser(id);
    return { message: "User deleted" };
  }

  @Put(":id/role")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update user role" })
  @ApiResponse({ status: 200, description: "User role updated", type: User })
  async updateUserRole(
    @Param("id") id: string,
    @Body() updateData: { role: string },
    @Req() req: any
  ): Promise<{ user: User; access_token?: string }> {
    // Only allow users to update their own role or admins to update any role
    if (req.user.id !== id && req.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const user = await this.usersService.updateUserRole(id, updateData.role);
    return { user };
  }
}
