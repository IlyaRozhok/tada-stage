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
import { FavouritesService } from "./favourites.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Property } from "../../entities/property.entity";

@ApiTags("favourites")
@Controller("favourites")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Post(":propertyId")
  @ApiOperation({ summary: "Add property to favourites" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Property added to favourites successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Property not found",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Property already in favourites",
  })
  async addToFavourites(
    @Request() req,
    @Param("propertyId") propertyId: string
  ) {
    const favouriteEntry = await this.favouritesService.addToFavourites(
      req.user.id,
      propertyId
    );

    return {
      message: "Property added to favourites successfully",
      data: favouriteEntry,
    };
  }

  @Delete(":propertyId")
  @ApiOperation({ summary: "Remove property from favourites" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Property removed from favourites successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Property not found in favourites",
  })
  async removeFromFavourites(
    @Request() req,
    @Param("propertyId") propertyId: string
  ) {
    await this.favouritesService.removeFromFavourites(req.user.id, propertyId);

    return {
      message: "Property removed from favourites successfully",
    };
  }

  @Get()
  @ApiOperation({ summary: "Get user's favourite properties" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Favourite properties retrieved successfully",
    type: [Property],
  })
  async getUserFavourites(@Request() req): Promise<Property[]> {
    return await this.favouritesService.getUserFavourites(req.user.id);
  }

  @Get("check/:propertyId")
  @ApiOperation({ summary: "Check if property is favourited" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Favourite status retrieved successfully",
  })
  async checkFavouriteStatus(
    @Request() req,
    @Param("propertyId") propertyId: string
  ) {
    const isFavourited = await this.favouritesService.isPropertyFavourited(
      req.user.id,
      propertyId
    );

    return {
      isFavourited,
    };
  }

  @Get("count")
  @ApiOperation({ summary: "Get favourites count" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Favourites count retrieved successfully",
  })
  async getFavouritesCount(@Request() req) {
    const count = await this.favouritesService.getFavouritesCount(req.user.id);

    return {
      count,
    };
  }
}
