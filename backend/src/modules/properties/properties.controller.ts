import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { PropertiesService } from "./properties.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { Property } from "../../entities/property.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
@ApiTags("Properties")
@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @ApiOperation({
    summary:
      "Create property with pre-uploaded media URLs (Operators and Admins)",
  })
  @ApiResponse({
    status: 201,
    description: "Property created successfully",
    type: Property,
  })
  @ApiConsumes("application/json")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("operator", "admin")
  @Post()
  async create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    return await this.propertiesService.create(
      createPropertyDto,
      req.user.id,
      req.user.roles
    );
  }

  @ApiOperation({ summary: "Update property data (Operators and Admins)" })
  @ApiResponse({
    status: 200,
    description: "Property updated successfully",
    type: Property,
  })
  @ApiConsumes("application/json")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("operator", "admin")
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updatePropertyDto: Partial<CreatePropertyDto>,
    @Request() req
  ) {
    return await this.propertiesService.update(
      id,
      updatePropertyDto,
      req.user.id,
      req.user.roles
    );
  }

  @ApiOperation({ summary: "Get operator's properties (Operators only)" })
  @ApiResponse({
    status: 200,
    description: "Operator properties retrieved",
    type: [Property],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("operator")
  @Get("my-properties")
  async getMyProperties(@Request() req) {
    return await this.propertiesService.findByOperator(req.user.id);
  }

  @ApiOperation({ summary: "Get featured properties for homepage" })
  @ApiResponse({
    status: 200,
    description: "Featured properties retrieved",
    type: [Property],
  })
  @Get("featured")
  async getFeaturedProperties(@Query("limit") limit?: number) {
    return await this.propertiesService.findFeaturedProperties(limit || 6);
  }

  @ApiOperation({ summary: "Get public properties (no auth required)" })
  @ApiResponse({
    status: 200,
    description: "Public properties retrieved",
    type: [Property],
  })
  @Get("public")
  async getPublicProperties(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 12,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("order") order?: "ASC" | "DESC"
  ) {
  
    const pageNum = parseInt(page as any) || 1;
    const limitNum = Math.min(parseInt(limit as any) || 12, 12);

    const result = await this.propertiesService.findAll(
      pageNum,
      limitNum,
      search,
      sortBy,
      order
    );

  
    return {
      data: result.properties,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      isPublic: true,
      maxPublicProperties: 12,
    };
  }

  @ApiOperation({
    summary: "Get all public properties with operators (no auth required)",
  })
  @ApiResponse({
    status: 200,
    description: "All public properties with operators retrieved",
    type: [Property],
  })
  @Get("public/all")
  async getAllPublicProperties(
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("order") order?: "ASC" | "DESC"
  ) {
    const result = await this.propertiesService.findAll(
      1,
      100, // Get up to 100 properties
      search,
      sortBy,
      order
    );

    return {
      data: result.properties,
      total: result.total,
    };
  }

  @ApiOperation({ summary: "Get single property by ID (no auth required)" })
  @ApiResponse({
    status: 200,
    description: "Property retrieved",
    type: Property,
  })
  @Get("public/:id")
  async getPublicProperty(@Param("id") id: string) {
    console.log("🏠 Backend - Getting public property:", id);
    const result = await this.propertiesService.findOne(id);
    console.log("🏠 Backend - Returning property:", result?.title);
    console.log("🖼️ Backend - Property has media:", !!result?.media?.length);
    return result;
  }

  @ApiOperation({ summary: "Get matched properties for logged-in tenant" })
  @ApiResponse({
    status: 200,
    description: "Matched properties retrieved",
    type: [Property],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles("tenant")
  @Get("matched")
  async getMatchedProperties(@Request() req, @Query("limit") limit?: number) {
    return await this.propertiesService.findMatchedProperties(
      req.user.userId,
      limit || 6
    );
  }

  @ApiOperation({
    summary: "Get operator dashboard statistics (Operators only)",
  })
  @ApiResponse({
    status: 200,
    description: "Operator statistics retrieved",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("operator")
  @Get("operator-stats")
  async getOperatorStats(@Request() req) {
    return await this.propertiesService.getOperatorStatistics(req.user.id);
  }

  @ApiOperation({
    summary: "Get tenants who shortlisted property (Operators only)",
  })
  @ApiResponse({
    status: 200,
    description: "Tenants who shortlisted the property",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("operator")
  @Get(":id/interested-tenants")
  async getInterestedTenants(@Param("id") propertyId: string, @Request() req) {
    return await this.propertiesService.getInterestedTenants(
      propertyId,
      req.user.id
    );
  }

  @ApiOperation({ summary: "Get all properties" })
  @ApiResponse({
    status: 200,
    description: "All properties retrieved",
    type: [Property],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "operator", "tenant")
  @Get()
  async findAll(
    @Request() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("order") order?: "ASC" | "DESC"
  ) {
    // Ensure page and limit are numbers
    const pageNum = parseInt(page as any) || 1;
    const limitNum = parseInt(limit as any) || 10;

    const result = await this.propertiesService.findAll(
      pageNum,
      limitNum,
      search,
      sortBy,
      order,
      req.user?.id
    );

    // Format response to match frontend expectations
    return {
      data: result.properties,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @ApiOperation({ summary: "Get property by ID" })
  @ApiResponse({
    status: 200,
    description: "Property retrieved",
    type: Property,
  })
  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    return await this.propertiesService.findOne(id, req.user?.id);
  }

  @ApiOperation({ summary: "Delete property (Operators and Admins)" })
  @ApiResponse({ status: 200, description: "Property deleted successfully" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("operator", "admin")
  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req) {
    return await this.propertiesService.remove(id, req.user.id, req.user.roles);
  }
}
