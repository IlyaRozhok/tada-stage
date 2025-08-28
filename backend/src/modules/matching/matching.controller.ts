import { Controller, Get, Query, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Auth } from "../../common/decorators/auth.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";
import { MatchingService, MatchingResult } from "./matching.service";
import { Property } from "../../entities/property.entity";

@ApiTags("Matching")
@Controller("matching")
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get("matches")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get property matches for tenant",
    description:
      "Returns properties that match the user preferences based on price, bedrooms, property type, and lifestyle features",
  })
  @ApiResponse({
    status: 200,
    description: "Matches retrieved successfully",
    type: [Property],
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of matches to return (default: 20)",
  })
  async getMatches(
    @CurrentUser() user: User,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20
  ): Promise<Property[]> {
    return await this.matchingService.findMatchedProperties(user.id, limit);
  }

  @Get("detailed-matches")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get detailed property matches with scores and reasons",
    description:
      "Returns properties with match scores and explanations of why they match user preferences",
  })
  @ApiResponse({
    status: 200,
    description: "Detailed matches retrieved successfully",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of matches to return (default: 10)",
  })
  async getDetailedMatches(
    @CurrentUser() user: User,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 10
  ): Promise<MatchingResult[]> {
    return await this.matchingService.getDetailedMatches(user.id, limit);
  }

  @Get("recommendations")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get property recommendations",
    description:
      "Get personalized property recommendations based on user preferences and behavior",
  })
  @ApiResponse({
    status: 200,
    description: "Recommendations retrieved successfully",
    type: [Property],
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of recommendations to return (default: 6)",
  })
  async getRecommendations(
    @CurrentUser() user: User,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 6
  ): Promise<Property[]> {
    // For now, use the same matching logic
    return await this.matchingService.findMatchedProperties(user.id, limit);
  }
}
