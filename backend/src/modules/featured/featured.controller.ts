import { Controller, Get, Query, Request } from "@nestjs/common";
import { FeaturedService } from "./featured.service";

@Controller("featured")
export class FeaturedController {
  constructor(private readonly featuredService: FeaturedService) {}

  @Get("residential-complexes")
  async getFeaturedResidentialComplexes(@Query("limit") limit?: number) {
    return this.featuredService.getFeaturedResidentialComplexes(limit || 3);
  }

  @Get("properties")
  async getFeaturedProperties(@Request() req, @Query("limit") limit?: number) {
    return this.featuredService.getFeaturedProperties(limit || 6, req?.user?.id);
  }

  @Get("home-cards")
  async getHomeCards() {
    return this.featuredService.getHomeCards();
  }
}
