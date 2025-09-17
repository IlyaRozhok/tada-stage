import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Auth } from "../../common/decorators/auth.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";
import {
  MatchingEnhancedService,
  EnhancedMatchingResult,
} from "./matching-enhanced.service";
import { Property } from "../../entities/property.entity";

@ApiTags("Enhanced Matching")
@Controller("matching/enhanced")
export class MatchingEnhancedController {
  constructor(
    private readonly matchingEnhancedService: MatchingEnhancedService
  ) {}

  @Get("matches")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get enhanced property matches for tenant",
    description:
      "Returns properties that match user preferences using advanced algorithms including location intelligence, commute analysis, and dynamic scoring",
  })
  @ApiResponse({
    status: 200,
    description: "Enhanced matches retrieved successfully",
    type: [Property],
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of matches to return (default: 20)",
  })
  async getEnhancedMatches(
    @CurrentUser() user: User,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20
  ): Promise<Property[]> {
    return await this.matchingEnhancedService.findEnhancedMatchedProperties(
      user.id,
      limit
    );
  }

  @Get("detailed-matches")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get detailed enhanced property matches with scores and reasons",
    description:
      "Returns properties with enhanced match scores, category breakdowns, and explanations of why they match user preferences",
  })
  @ApiResponse({
    status: 200,
    description: "Detailed enhanced matches retrieved successfully",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of matches to return (default: 10)",
  })
  @ApiQuery({
    name: "includeInsights",
    required: false,
    type: Boolean,
    description: "Include matching insights and analytics (default: false)",
  })
  async getDetailedEnhancedMatches(
    @CurrentUser() user: User,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query("includeInsights", new ParseBoolPipe({ optional: true }))
    includeInsights: boolean = false
  ): Promise<EnhancedMatchingResult[]> {
    return await this.matchingEnhancedService.getDetailedEnhancedMatches(
      user.id,
      limit,
      includeInsights
    );
  }

  @Get("perfect-matches")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get perfect enhanced matches only",
    description:
      "Returns properties that are perfect matches based on enhanced scoring algorithm",
  })
  @ApiResponse({
    status: 200,
    description: "Perfect enhanced matches retrieved successfully",
    type: [Property],
  })
  async getPerfectEnhancedMatches(
    @CurrentUser() user: User
  ): Promise<Property[]> {
    return await this.matchingEnhancedService.getPerfectEnhancedMatches(
      user.id
    );
  }

  @Get("high-score-matches")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get high-score enhanced matches above threshold",
    description:
      "Returns properties with enhanced match scores above the specified threshold",
  })
  @ApiResponse({
    status: 200,
    description: "High-score enhanced matches retrieved successfully",
  })
  @ApiQuery({
    name: "threshold",
    required: false,
    type: Number,
    description: "Minimum match score threshold (default: 80)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of matches to return (default: 20)",
  })
  async getHighScoreEnhancedMatches(
    @CurrentUser() user: User,
    @Query("threshold", new ParseIntPipe({ optional: true }))
    threshold: number = 80,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20
  ): Promise<EnhancedMatchingResult[]> {
    return await this.matchingEnhancedService.getHighScoreEnhancedMatches(
      user.id,
      threshold,
      limit
    );
  }

  @Get("recommendations")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get personalized property recommendations",
    description:
      "Get personalized property recommendations based on enhanced matching algorithms and user preferences",
  })
  @ApiResponse({
    status: 200,
    description: "Personalized recommendations retrieved successfully",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of recommendations to return (default: 10)",
  })
  async getPersonalizedRecommendations(
    @CurrentUser() user: User,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 10
  ): Promise<EnhancedMatchingResult[]> {
    return await this.matchingEnhancedService.getPersonalizedRecommendations(
      user.id,
      limit
    );
  }

  @Get("insights")
  @Auth("tenant")
  @ApiOperation({
    summary: "Get matching insights and analytics",
    description:
      "Get detailed insights about your matching results, including statistics and recommendations",
  })
  @ApiResponse({
    status: 200,
    description: "Matching insights retrieved successfully",
  })
  async getMatchingInsights(@CurrentUser() user: User): Promise<{
    totalCandidates: number;
    perfectMatches: number;
    highScoreMatches: number;
    averageScore: number;
    topCategories: string[];
    recommendations: string[];
    propertyStatistics: any;
  }> {
    return await this.matchingEnhancedService.getMatchingInsights(user.id);
  }

  @Get("generate-matches/:propertyId")
  @Auth("operator")
  @ApiOperation({
    summary: "Generate enhanced matches for a specific property",
    description:
      "Generate enhanced matches for a specific property against all tenant preferences and send notifications",
  })
  @ApiResponse({
    status: 200,
    description: "Enhanced matches generated successfully",
  })
  async generateEnhancedMatches(
    @Query("propertyId") propertyId: string
  ): Promise<{ message: string; notificationsSent: number }> {
    await this.matchingEnhancedService.generateEnhancedMatches(propertyId);
    return {
      message: "Enhanced matches generated successfully",
      notificationsSent: 0, // This would be returned from the service in a real implementation
    };
  }
}

