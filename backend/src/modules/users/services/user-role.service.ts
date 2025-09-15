import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../../../entities/user.entity";
import { TenantProfile } from "../../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../../entities/operator-profile.entity";
import { Preferences } from "../../../entities/preferences.entity";
import { UserProfileService } from "./user-profile.service";

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    private userProfileService: UserProfileService
  ) {}

  async updateUserRole(userId: string, role: UserRole | string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile", "preferences"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Convert string to enum if needed
    const roleEnum =
      typeof role === "string"
        ? Object.values(UserRole).find((r) => r === role) || UserRole.Tenant
        : role;

    const oldRole = user.role;

    // Use transaction to ensure data consistency
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update user role
      await queryRunner.manager.update(User, userId, { role: roleEnum });

      // Handle profile cleanup and creation based on role change
      await this.handleRoleTransition(queryRunner, user, oldRole, roleEnum);

      await queryRunner.commitTransaction();

      // Return updated user with relations
      return await this.userRepository.findOne({
        where: { id: userId },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error updating user role:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleRoleTransition(
    queryRunner: any,
    user: User,
    oldRole: UserRole,
    newRole: UserRole
  ): Promise<void> {
    // Tenant to Operator
    if (oldRole === UserRole.Tenant && newRole === UserRole.Operator) {
      await this.transitionTenantToOperator(queryRunner, user);
    }
    // Operator to Tenant
    else if (oldRole === UserRole.Operator && newRole === UserRole.Tenant) {
      await this.transitionOperatorToTenant(queryRunner, user);
    }
    // Any role to Admin
    else if (newRole === UserRole.Admin) {
      await this.transitionToAdmin(queryRunner, user);
    }
    // Admin to Tenant
    else if (oldRole === UserRole.Admin && newRole === UserRole.Tenant) {
      await this.transitionAdminToTenant(queryRunner, user);
    }
    // Admin to Operator
    else if (oldRole === UserRole.Admin && newRole === UserRole.Operator) {
      await this.transitionAdminToOperator(queryRunner, user);
    }
  }

  private async transitionTenantToOperator(
    queryRunner: any,
    user: User
  ): Promise<void> {
    // Remove tenant profile and preferences
    if (user.tenantProfile) {
      await queryRunner.manager.delete(TenantProfile, { userId: user.id });
    }
    if (user.preferences) {
      await queryRunner.manager.delete(Preferences, { user_id: user.id });
    }

    // Create operator profile if doesn't exist
    if (!user.operatorProfile) {
      const operatorProfile = queryRunner.manager.create(OperatorProfile, {
        userId: user.id,
        full_name: user.full_name || user.tenantProfile?.full_name,
      });
      await queryRunner.manager.save(OperatorProfile, operatorProfile);
    }
  }

  private async transitionOperatorToTenant(
    queryRunner: any,
    user: User
  ): Promise<void> {
    // Remove operator profile
    if (user.operatorProfile) {
      await queryRunner.manager.delete(OperatorProfile, { userId: user.id });
    }

    // Create tenant profile if doesn't exist
    if (!user.tenantProfile) {
      const tenantProfile = queryRunner.manager.create(TenantProfile, {
        userId: user.id,
        full_name: user.full_name || user.operatorProfile?.full_name,
      });
      await queryRunner.manager.save(TenantProfile, tenantProfile);
    }

    // Create preferences if doesn't exist
    if (!user.preferences) {
      const preferences = queryRunner.manager.create(Preferences, {
        user_id: user.id,
      });
      await queryRunner.manager.save(Preferences, preferences);
    }
  }

  private async transitionToAdmin(queryRunner: any, user: User): Promise<void> {
    // Remove all profiles and preferences for admin
    if (user.tenantProfile) {
      await queryRunner.manager.delete(TenantProfile, { userId: user.id });
    }
    if (user.operatorProfile) {
      await queryRunner.manager.delete(OperatorProfile, { userId: user.id });
    }
    if (user.preferences) {
      await queryRunner.manager.delete(Preferences, { user_id: user.id });
    }
  }

  private async transitionAdminToTenant(
    queryRunner: any,
    user: User
  ): Promise<void> {
    // Create tenant profile and preferences for admin becoming tenant
    const tenantProfile = queryRunner.manager.create(TenantProfile, {
      userId: user.id,
      full_name: user.full_name,
    });
    await queryRunner.manager.save(TenantProfile, tenantProfile);

    const preferences = queryRunner.manager.create(Preferences, {
      user_id: user.id,
    });
    await queryRunner.manager.save(Preferences, preferences);
  }

  private async transitionAdminToOperator(
    queryRunner: any,
    user: User
  ): Promise<void> {
    // Create operator profile for admin becoming operator
    const operatorProfile = queryRunner.manager.create(OperatorProfile, {
      userId: user.id,
      full_name: user.full_name,
    });
    await queryRunner.manager.save(OperatorProfile, operatorProfile);
  }
}

