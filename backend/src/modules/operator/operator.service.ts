import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Shortlist } from "../../entities/shortlist.entity";
import { User } from "../../entities/user.entity";
import { Preferences } from "../../entities/preferences.entity";

@Injectable()
export class OperatorService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    @InjectRepository(Shortlist)
    private shortlistRepository: Repository<Shortlist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>
  ) {}

  async getDashboardCounts(operatorId: string) {
    console.log("🔍 OperatorService.getDashboardCounts called with:", {
      operatorId,
    });

    try {
      // Count properties owned by operator
      const propertiesCount = await this.propertyRepository.count({
        where: { operator_id: operatorId },
      });
      console.log("✅ Properties count:", propertiesCount);

      // Временно упрощаем для тестирования
      const result = {
        propertiesCount,
        tenantsCount: 0, // Временно 0
        matchesCount: 0, // Временно 0
      };

      console.log("✅ Dashboard counts result (simplified):", result);
      return result;
    } catch (error) {
      console.error("❌ Error in getDashboardCounts:", error);
      throw error;
    }
  }

  async getTenants(operatorId: string) {
    console.log("🔍 OperatorService.getTenants called with:", { operatorId });

    try {
      // Временная заглушка для тестирования
      console.log("⚠️ Using temporary fallback for getTenants");
      return [];

      // TODO: Восстановить после исправления связей
      // Get all tenants who have shortlisted at least one of operator's properties
      const tenants = await this.userRepository
        .createQueryBuilder("user")
        .innerJoin("user.shortlists", "shortlist")
        .innerJoin("shortlist.property", "property")
        .leftJoinAndSelect("user.preferences", "preferences")
        .leftJoinAndSelect("user.tenantProfile", "tenantProfile")
        .where("property.operator_id = :operatorId", { operatorId })
        .andWhere("user.role = :role", { role: "tenant" })
        .select([
          "user.id",
          "user.email",
          "user.role",
          "tenantProfile.id",
          "tenantProfile.full_name",
          "preferences.id",
          "preferences.min_price",
          "preferences.max_price",
          "preferences.min_bedrooms",
          "preferences.max_bedrooms",
          "preferences.property_type",
          "preferences.primary_postcode",
          "preferences.secondary_location",
          "preferences.lifestyle_features",
          "preferences.furnishing",
        ])
        .getMany();

      console.log("✅ Tenants found:", tenants.length);
      return tenants;
    } catch (error) {
      console.error("❌ Error in getTenants:", error);
      throw error;
    }
  }

  async getOperatorProperties(operatorId: string) {
    console.log("🔍 OperatorService.getOperatorProperties called with:", {
      operatorId,
    });

    try {
      const properties = await this.propertyRepository.find({
        where: { operator_id: operatorId },
        select: [
          "id",
          "title",
          "address",
          "price",
          "bedrooms",
          "bathrooms",
          "property_type",
        ],
      });

      console.log("✅ Properties found:", properties.length);
      return properties;
    } catch (error) {
      console.error("❌ Error in getOperatorProperties:", error);
      throw error;
    }
  }

  async suggestProperty(
    operatorId: string,
    tenantId: string,
    propertyId: string
  ) {
    // Verify the property belongs to the operator
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId, operator_id: operatorId },
    });

    if (!property) {
      throw new Error("Property not found or does not belong to operator");
    }

    // Verify the tenant exists
    const tenant = await this.userRepository.findOne({
      where: { id: tenantId },
      relations: ["tenantProfile"],
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Here you could implement actual suggestion logic
    // For now, we'll just return success
    return {
      success: true,
      message: `Property "${property.title}" suggested to ${tenant.tenantProfile?.full_name || tenant.email}`,
      property: {
        id: property.id,
        title: property.title,
        address: property.address,
        price: property.price,
      },
      tenant: {
        id: tenant.id,
        name: tenant.tenantProfile?.full_name || tenant.email,
        email: tenant.email,
      },
    };
  }
}
