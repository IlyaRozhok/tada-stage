import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PropertyMediaService } from "./property-media.service";
import { PropertyMedia } from "../../entities/property-media.entity";
import { Auth } from "../../common/decorators/auth.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Property Media")
@Controller("properties/:propertyId/media")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PropertyMediaController {
  constructor(private readonly propertyMediaService: PropertyMediaService) {}

  @Post()
  @ApiOperation({ summary: "Upload media file for property" })
  @ApiResponse({
    status: 201,
    description: "File uploaded successfully",
    type: PropertyMedia,
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadMedia(
    @Param("propertyId") propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ): Promise<PropertyMedia> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    return await this.propertyMediaService.uploadFile(
      propertyId,
      req.user.id,
      file,
      undefined,
      undefined,
      req.user.role
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all media for property" })
  @ApiResponse({
    status: 200,
    description: "Media files retrieved",
    type: [PropertyMedia],
  })
  async getPropertyMedia(
    @Param("propertyId") propertyId: string
  ): Promise<PropertyMedia[]> {
    return await this.propertyMediaService.getAllPropertyMedia(propertyId);
  }

  @Delete(":mediaId")
  @ApiOperation({ summary: "Delete media file" })
  @ApiResponse({ status: 200, description: "Media file deleted" })
  async deleteMedia(
    @Param("propertyId") propertyId: string,
    @Param("mediaId") mediaId: string,
    @Request() req: any
  ): Promise<void> {
    return await this.propertyMediaService.deleteMedia(
      mediaId,
      req.user.id,
      req.user.role
    );
  }

  @Put("order")
  @Auth("operator", "admin")
  @ApiOperation({
    summary: "Update media display order",
    description: "Update the display order of media files for a property",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        mediaOrders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              order_index: { type: "number" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Media order updated successfully",
    type: [PropertyMedia],
  })
  @ApiResponse({
    status: 403,
    description: "Not authorized to update media for this property",
  })
  @ApiResponse({
    status: 404,
    description: "Property not found",
  })
  async updateMediaOrder(
    @Param("propertyId") propertyId: string,
    @CurrentUser() user: User,
    @Body("mediaOrders") mediaOrders: { id: string; order_index: number }[]
  ): Promise<PropertyMedia[]> {
    return await this.propertyMediaService.updateMediaOrder(
      propertyId,
      user.id,
      mediaOrders,
      user.role
    );
  }

  @Put(":mediaId/featured")
  @Auth("operator", "admin")
  @ApiOperation({
    summary: "Set media as featured",
    description: "Mark a media file as the featured image for the property",
  })
  @ApiResponse({
    status: 200,
    description: "Featured media updated successfully",
    type: PropertyMedia,
  })
  @ApiResponse({
    status: 403,
    description: "Not authorized to update media for this property",
  })
  @ApiResponse({
    status: 404,
    description: "Media not found",
  })
  async setFeaturedMedia(
    @Param("mediaId") mediaId: string,
    @CurrentUser() user: User
  ): Promise<PropertyMedia> {
    return await this.propertyMediaService.setFeaturedMedia(
      mediaId,
      user.id,
      user.role
    );
  }
}
