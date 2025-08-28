import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ShortlistService } from "./shortlist.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Property } from "../../entities/property.entity";

@ApiTags("shortlist")
@Controller("shortlist")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShortlistController {
  constructor(private readonly shortlistService: ShortlistService) {}

  @Post(":propertyId")
  @ApiOperation({ summary: "Add property to shortlist" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Property added to shortlist successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Property not found",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Property already in shortlist",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Only tenants can have shortlists",
  })
  async addToShortlist(
    @Request() req,
    @Param("propertyId") propertyId: string
  ) {
    const result = await this.shortlistService.addToShortlist(
      req.user.id,
      propertyId
    );

    return result;
  }

  @Delete(":propertyId")
  @ApiOperation({ summary: "Remove property from shortlist" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Property removed from shortlist successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Property not found in shortlist",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Only tenants can have shortlists",
  })
  async removeFromShortlist(
    @Request() req,
    @Param("propertyId") propertyId: string
  ) {
    const result = await this.shortlistService.removeFromShortlist(
      req.user.id,
      propertyId
    );

    return result;
  }

  @Get()
  @ApiOperation({ summary: "Get user's shortlisted properties" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Shortlisted properties retrieved successfully",
    type: [Property],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Only tenants can have shortlists",
  })
  async getUserShortlist(@Request() req): Promise<Property[]> {
    return await this.shortlistService.getUserShortlist(req.user.id);
  }

  @Get("count")
  @ApiOperation({ summary: "Get shortlist count" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Shortlist count retrieved successfully",
  })
  async getShortlistCount(@Request() req) {
    const count = await this.shortlistService.getShortlistCount(req.user.id);
    return {
      count,
    };
  }

  @Get("check/:propertyId")
  @ApiOperation({ summary: "Check if property is shortlisted" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Shortlist status retrieved successfully",
  })
  async checkShortlistStatus(
    @Request() req,
    @Param("propertyId") propertyId: string
  ) {
    const isShortlisted = await this.shortlistService.isPropertyShortlisted(
      req.user.id,
      propertyId
    );

    return {
      isShortlisted,
    };
  }

  @Delete()
  @ApiOperation({ summary: "Clear entire shortlist" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Shortlist cleared successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Only tenants can have shortlists",
  })
  async clearShortlist(@Request() req) {
    const result = await this.shortlistService.clearShortlist(req.user.id);
    return result;
  }
}
