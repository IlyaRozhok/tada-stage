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
  UseInterceptors,
  UploadedFiles,
  Patch,
  UploadedFile,
} from "@nestjs/common";
import { FilesInterceptor, FileInterceptor } from "@nestjs/platform-express";
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
import {
  imageUploadOptions,
  convertFilePathsToUrls,
} from "../../common/utils/file-upload.util";
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
    @Query("limit") limit: number = 6,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("order") order?: "ASC" | "DESC"
  ) {
    // Ensure page and limit are numbers, max 6 for public access
    const pageNum = parseInt(page as any) || 1;
    const limitNum = Math.min(parseInt(limit as any) || 6, 6);

    const result = await this.propertiesService.findAll(
      pageNum,
      limitNum,
      search,
      sortBy,
      order
    );

    // Format response to match frontend expectations
    return {
      data: result.properties,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      isPublic: true,
      maxPublicProperties: 6,
    };
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
      order
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
  async findOne(@Param("id") id: string) {
    return await this.propertiesService.findOne(id);
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

  @ApiOperation({
    summary: "Create property with local file upload (Operators and Admins)",
  })
  @ApiResponse({
    status: 201,
    description: "Property created successfully",
    type: Property,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("operator", "admin")
  @UseInterceptors(FilesInterceptor("images", 10, imageUploadOptions))
  @Post("with-upload")
  async createWithUpload(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    // Handle FormData arrays correctly - lifestyle_features[] comes as a single field
    if (
      createPropertyDto.lifestyle_features &&
      typeof createPropertyDto.lifestyle_features === "string"
    ) {
      // If it's a single string, convert to array
      createPropertyDto.lifestyle_features = [
        createPropertyDto.lifestyle_features,
      ];
    }

    // Convert uploaded files to URLs
    const imageUrls = files
      ? convertFilePathsToUrls(files, req.protocol + "://" + req.get("host"))
      : [];

    const propertyData = {
      ...createPropertyDto,
      images: imageUrls,
    };

    return await this.propertiesService.create(
      propertyData,
      req.user.id,
      req.user.roles
    );
  }
}
