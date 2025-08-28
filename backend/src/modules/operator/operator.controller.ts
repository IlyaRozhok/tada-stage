import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OperatorService } from "./operator.service";

@Controller("operator")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("operator")
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @Get("dashboard")
  async getDashboard(@Req() req) {
    console.log("🔍 Operator Dashboard Request:", {
      user_id: req.user?.id,
      user_role: req.user?.role,
      user_roles: req.user?.roles,
      user_email: req.user?.email,
      has_tenant_profile: !!req.user?.tenantProfile,
      has_operator_profile: !!req.user?.operatorProfile,
    });
    return this.operatorService.getDashboardCounts(req.user.id);
  }

  @Get("tenants")
  async getTenants(@Req() req) {
    return this.operatorService.getTenants(req.user.id);
  }

  @Get("properties")
  async getOperatorProperties(@Req() req) {
    return this.operatorService.getOperatorProperties(req.user.id);
  }

  @Post("suggest-property")
  async suggestProperty(
    @Req() req,
    @Body() body: { tenantId: string; propertyId: string }
  ) {
    return this.operatorService.suggestProperty(
      req.user.id,
      body.tenantId,
      body.propertyId
    );
  }
}
