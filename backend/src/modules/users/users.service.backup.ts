import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { Preferences } from "../../entities/preferences.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserProfileService } from "./services/user-profile.service";
import { UserRoleService } from "./services/user-role.service";
import { USER_CONSTANTS } from "../../common/constants/user.constants";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    private userProfileService: UserProfileService,
    private userRoleService: UserRoleService
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      select: ["id", "email", "role", "status", "created_at", "updated_at"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Add phone number from the appropriate profile to the user object for easy access
    this.addPhoneToUser(user);

    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Update user basic info
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.status) user.status = updateUserDto.status;

    // Update profile based on role
    if (user.role === UserRole.Tenant) {
      await this.userProfileService.updateTenantProfile(user, updateUserDto);
      if (
        updateUserDto.pets !== undefined ||
        updateUserDto.smoker !== undefined ||
        updateUserDto.hobbies
      ) {
        await this.userProfileService.updatePreferences(user, updateUserDto);
      }
    } else if (user.role === UserRole.Operator) {
      await this.userProfileService.updateOperatorProfile(user, updateUserDto);
    }

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      select: ["id", "email", "role", "status", "created_at", "updated_at"],
    });

    if (user) {
      this.addPhoneToUser(user);
    }

    return user;
  }

  async deleteAccount(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        "preferences",
        "tenantProfile",
        "operatorProfile",
        "shortlists",
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Use transaction to ensure all deletions succeed or fail together
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.deleteUserData(queryRunner, user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error deleting user:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllPaginated({
    page,
    limit,
    search = "",
    sortBy = "created_at",
    order = "DESC",
  }: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    order?: "ASC" | "DESC";
  }) {
    const skip = (page - 1) * limit;

    // Validate sortBy field to prevent SQL injection and errors
    const safeSortBy = USER_CONSTANTS.VALID_SORT_FIELDS.includes(sortBy as any)
      ? sortBy
      : "created_at";
    const safeOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Check if full_name column exists in users table
    const hasFullNameColumn = await this.checkFullNameColumnExists();

    const query = this.buildUserQuery(
      search,
      hasFullNameColumn,
      safeSortBy,
      safeOrder,
      skip,
      limit
    );
    const [users, total] = await query.getManyAndCount();

    // Add phone numbers from profiles to users for easy access
    const usersWithPhone = users.map((user) => {
      this.addPhoneToUser(user);
      return user;
    });

    return {
      data: usersWithPhone,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminUpdateUser(id: string, dto: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["tenantProfile", "operatorProfile"],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const oldRole = user.role;

    // Update basic user fields
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.status !== undefined) user.status = dto.status;

    // Handle role changes
    if (dto.role !== undefined && dto.role !== oldRole) {
      return await this.userRoleService.updateUserRole(id, dto.role);
    }

    // Handle phone number updates in the appropriate profile
    if (dto.phone !== undefined) {
      await this.updateUserPhone(user, dto.phone);
    }

    return this.userRepository.save(user);
  }

  async adminCreateUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Normalize role
    const userRole = dto.role || UserRole.Tenant;
    const normalizedRole =
      typeof userRole === "string"
        ? Object.values(UserRole).find((role) => role === userRole) ||
          UserRole.Tenant
        : userRole;

    const user = this.userRepository.create({
      email: dto.email,
      role: normalizedRole,
      status: UserStatus.Active,
      password: await bcrypt.hash(
        dto.password,
        USER_CONSTANTS.PASSWORD_SALT_ROUNDS
      ),
    });
    const savedUser = await this.userRepository.save(user);

    // Create appropriate profile based on role
    if (normalizedRole === UserRole.Tenant) {
      savedUser.tenantProfile =
        await this.userProfileService.createTenantProfile(
          savedUser.id,
          dto.full_name
        );
    } else if (normalizedRole === UserRole.Operator) {
      savedUser.operatorProfile =
        await this.userProfileService.createOperatorProfile(
          savedUser.id,
          dto.full_name
        );
    }

    // Return user with relations loaded
    return this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ["tenantProfile", "operatorProfile"],
    });
  }

  async adminDeleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        "preferences",
        "tenantProfile",
        "operatorProfile",
        "shortlists",
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Use transaction to ensure all deletions succeed or fail together
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.deleteUserData(queryRunner, user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error deleting user:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateUserRole(userId: string, role: UserRole | string): Promise<User> {
    return await this.userRoleService.updateUserRole(userId, role);
  }

  async runCleanupMigration(): Promise<any> {
    console.log("🧹 Starting user profile cleanup migration...");

    // Get all users with their profiles
    const users = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.tenantProfile", "tenantProfile")
      .leftJoinAndSelect("user.operatorProfile", "operatorProfile")
      .leftJoinAndSelect("user.preferences", "preferences")
      .getMany();

    console.log(`📊 Found ${users.length} users to process`);

    let cleanedUsers = 0;
    let removedTenantProfiles = 0;
    let removedOperatorProfiles = 0;
    let removedPreferences = 0;
    let createdTenantProfiles = 0;
    let createdOperatorProfiles = 0;
    let createdPreferences = 0;

    for (const user of users) {
      console.log(`🔍 Processing user: ${user.email} (${user.role})`);

      if (user.role === UserRole.Tenant) {
        // Tenant should have tenant profile and preferences, but no operator profile
        if (user.operatorProfile) {
          console.log(`  ❌ Removing operator profile for tenant`);
          await this.operatorProfileRepository.remove(user.operatorProfile);
          removedOperatorProfiles++;
        }

        if (!user.tenantProfile) {
          console.log(`  ✅ Creating missing tenant profile`);
          const tenantProfile = this.tenantProfileRepository.create({
            userId: user.id,
            full_name: user.full_name,
          });
          await this.tenantProfileRepository.save(tenantProfile);
          createdTenantProfiles++;
        }

        if (!user.preferences) {
          console.log(`  ✅ Creating missing preferences`);
          const preferences = this.preferencesRepository.create({
            user_id: user.id,
          });
          await this.preferencesRepository.save(preferences);
          createdPreferences++;
        }
      } else if (user.role === UserRole.Operator) {
        // Operator should have operator profile, but no tenant profile or preferences
        if (user.tenantProfile) {
          console.log(`  ❌ Removing tenant profile for operator`);
          await this.tenantProfileRepository.remove(user.tenantProfile);
          removedTenantProfiles++;
        }

        if (user.preferences) {
          console.log(`  ❌ Removing preferences for operator`);
          await this.preferencesRepository.remove(user.preferences);
          removedPreferences++;
        }

        if (!user.operatorProfile) {
          console.log(`  ✅ Creating missing operator profile`);
          const operatorProfile = this.operatorProfileRepository.create({
            userId: user.id,
            full_name: user.full_name,
          });
          await this.operatorProfileRepository.save(operatorProfile);
          createdOperatorProfiles++;
        }
      } else if (user.role === UserRole.Admin) {
        // Admin should have no profiles or preferences
        if (user.tenantProfile) {
          console.log(`  ❌ Removing tenant profile for admin`);
          await this.tenantProfileRepository.remove(user.tenantProfile);
          removedTenantProfiles++;
        }

        if (user.operatorProfile) {
          console.log(`  ❌ Removing operator profile for admin`);
          await this.operatorProfileRepository.remove(user.operatorProfile);
          removedOperatorProfiles++;
        }

        if (user.preferences) {
          console.log(`  ❌ Removing preferences for admin`);
          await this.preferencesRepository.remove(user.preferences);
          removedPreferences++;
        }
      } else {
        // Handle users with null role - set them as tenants by default
        console.log(`  ⚠️ User has null role, setting as tenant`);
        await this.userRepository.update(user.id, { role: UserRole.Tenant });

        if (!user.tenantProfile) {
          const tenantProfile = this.tenantProfileRepository.create({
            userId: user.id,
            full_name: user.full_name,
          });
          await this.tenantProfileRepository.save(tenantProfile);
          createdTenantProfiles++;
        }

        if (!user.preferences) {
          const preferences = this.preferencesRepository.create({
            user_id: user.id,
          });
          await this.preferencesRepository.save(preferences);
          createdPreferences++;
        }
      }

      cleanedUsers++;
    }

    console.log("✅ User profile cleanup completed:");
    console.log(`  📊 Processed users: ${cleanedUsers}`);
    console.log(`  🗑️ Removed tenant profiles: ${removedTenantProfiles}`);
    console.log(`  🗑️ Removed operator profiles: ${removedOperatorProfiles}`);
    console.log(`  🗑️ Removed preferences: ${removedPreferences}`);
    console.log(`  ➕ Created tenant profiles: ${createdTenantProfiles}`);
    console.log(`  ➕ Created operator profiles: ${createdOperatorProfiles}`);
    console.log(`  ➕ Created preferences: ${createdPreferences}`);

    return {
      processedUsers: cleanedUsers,
      removedTenantProfiles,
      removedOperatorProfiles,
      removedPreferences,
      createdTenantProfiles,
      createdOperatorProfiles,
      createdPreferences,
    };
  }

  // Private helper methods
  private addPhoneToUser(user: User): void {
    if (user.tenantProfile?.phone) {
      (user as any).phone = user.tenantProfile.phone;
    } else if (user.operatorProfile?.phone) {
      (user as any).phone = user.operatorProfile.phone;
    }
  }

  private async checkFullNameColumnExists(): Promise<boolean> {
    const result = await this.userRepository.manager.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'full_name'
    `);
    return result.length > 0;
  }

  private buildUserQuery(
    search: string,
    hasFullNameColumn: boolean,
    sortBy: string,
    order: string,
    skip: number,
    limit: number
  ) {
    const query = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.tenantProfile", "tenantProfile")
      .leftJoinAndSelect("user.operatorProfile", "operatorProfile");

    if (search) {
      if (hasFullNameColumn) {
        query.where(
          "user.full_name ILIKE :search OR user.email ILIKE :search",
          {
            search: `%${search}%`,
          }
        );
      } else {
        query.where(
          "tenantProfile.full_name ILIKE :search OR operatorProfile.full_name ILIKE :search OR user.email ILIKE :search",
          { search: `%${search}%` }
        );
      }
    }

    // Safe sorting with column existence check
    if (sortBy === "full_name" && !hasFullNameColumn) {
      query.orderBy("user.created_at", order as any);
    } else {
      query.orderBy(`user.${sortBy}`, order as any);
    }

    return query.skip(skip).take(limit);
  }

  private async deleteUserData(queryRunner: any, user: User): Promise<void> {
    // Delete shortlists first (they reference user)
    if (user.shortlists && user.shortlists.length > 0) {
      await queryRunner.manager.delete("shortlist", { userId: user.id });
    }

    // Delete any properties owned by the user (if they are an operator)
    await queryRunner.manager.delete("properties", { operator_id: user.id });

    // Delete profiles and preferences
    if (user.tenantProfile) {
      await queryRunner.manager.delete("tenant_profiles", { userId: user.id });
    }
    if (user.operatorProfile) {
      await queryRunner.manager.delete("operator_profiles", {
        userId: user.id,
      });
    }
    if (user.preferences) {
      await queryRunner.manager.delete("preferences", { user_id: user.id });
    }

    // Finally delete the user
    await queryRunner.manager.delete("users", { id: user.id });
  }

  private async updateUserPhone(user: User, phone: string): Promise<void> {
    if (user.role === UserRole.Tenant && user.tenantProfile) {
      user.tenantProfile.phone = phone;
      await this.tenantProfileRepository.save(user.tenantProfile);
    } else if (user.role === UserRole.Operator && user.operatorProfile) {
      user.operatorProfile.phone = phone;
      await this.operatorProfileRepository.save(user.operatorProfile);
    }
  }
}
