import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { PreferencesService } from "./preferences.service";
import { CreatePreferencesDto } from "./dto/create-preferences.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { Preferences } from "../../entities/preferences.entity";
import { Auth } from "../../common/decorators/auth.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";

@ApiTags("Preferences")
@Controller("preferences")
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get("all")
  @Auth("admin")
  @ApiOperation({ summary: "Get all preferences (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "All preferences retrieved successfully",
    type: [Preferences],
  })
  async findAll(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string
  ) {
    // Ensure page and limit are numbers
    const pageNum = parseInt(page as any) || 1;
    const limitNum = parseInt(limit as any) || 10;

    const result = await this.preferencesService.findAll(
      pageNum,
      limitNum,
      search
    );

    // Format response to match frontend expectations
    return {
      data: result.preferences,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Post()
  @Auth("tenant")
  @ApiOperation({ summary: "Save tenant preferences (create or update)" })
  @ApiResponse({
    status: 201,
    description: "Preferences saved successfully",
    type: Preferences,
  })
  @ApiResponse({
    status: 403,
    description: "Only tenants can set preferences",
  })
  async save(
    @CurrentUser() user: User,
    @Body() createPreferencesDto: CreatePreferencesDto
  ): Promise<Preferences> {
    console.log("📥 Received preferences data:", createPreferencesDto);
    const result = await this.preferencesService.upsert(
      user.id,
      createPreferencesDto
    );
    console.log("💾 Saved preferences:", result);
    return result;
  }

  @Get()
  @Auth("tenant")
  @ApiOperation({ summary: "Get current user preferences" })
  @ApiResponse({
    status: 200,
    description: "Preferences retrieved successfully",
    type: Preferences,
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async findMy(@CurrentUser() user: User): Promise<Preferences | null> {
    const preferences = await this.preferencesService.findByUserId(user.id);
    console.log("📤 Returning preferences for user:", user.id, preferences);
    return preferences;
  }

  @Put()
  @Auth("tenant")
  @ApiOperation({ summary: "Update tenant preferences" })
  @ApiResponse({
    status: 200,
    description: "Preferences updated successfully",
    type: Preferences,
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async update(
    @CurrentUser() user: User,
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ): Promise<Preferences> {
    return this.preferencesService.update(user.id, updatePreferencesDto);
  }

  @Delete()
  @Auth("tenant")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete tenant preferences" })
  @ApiResponse({
    status: 204,
    description: "Preferences deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async delete(@CurrentUser() user: User): Promise<void> {
    return this.preferencesService.delete(user.id);
  }

  @Put("admin/:userId")
  @Auth("admin")
  @ApiOperation({ summary: "Update user preferences (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Preferences updated successfully",
    type: Preferences,
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async updateByAdmin(
    @Param("userId") userId: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ): Promise<Preferences> {
    return this.preferencesService.update(userId, updatePreferencesDto);
  }

  @Delete("admin/:userId")
  @Auth("admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Clear user preferences (Admin only)" })
  @ApiResponse({
    status: 204,
    description: "Preferences cleared successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Preferences not found",
  })
  async clearByAdmin(@Param("userId") userId: string): Promise<void> {
    return this.preferencesService.clear(userId);
  }
}
