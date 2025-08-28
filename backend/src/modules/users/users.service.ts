import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Like } from "typeorm";

import { User } from "../../entities/user.entity";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      select: [
        "id",
        "email",
        "role",
        "status",
        "full_name",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Add phone number from the appropriate profile to the user object for easy access
    if (user.tenantProfile?.phone) {
      (user as any).phone = user.tenantProfile.phone;
    } else if (user.operatorProfile?.phone) {
      (user as any).phone = user.operatorProfile.phone;
    }

    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Update user basic info
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.status) user.status = updateUserDto.status;
    if (updateUserDto.full_name) user.full_name = updateUserDto.full_name;

    // Update profile based on role
    if (user.role === "tenant" && user.tenantProfile) {
      if (updateUserDto.phone) user.tenantProfile.phone = updateUserDto.phone;
      if (updateUserDto.age_range)
        user.tenantProfile.age_range = updateUserDto.age_range;
      if (updateUserDto.occupation)
        user.tenantProfile.occupation = updateUserDto.occupation;
      if (updateUserDto.industry)
        user.tenantProfile.industry = updateUserDto.industry;
      if (updateUserDto.work_style)
        user.tenantProfile.work_style = updateUserDto.work_style;
      if (updateUserDto.lifestyle)
        user.tenantProfile.lifestyle = updateUserDto.lifestyle;
      if (updateUserDto.pets) user.tenantProfile.pets = updateUserDto.pets;
      if (updateUserDto.smoker !== undefined)
        user.tenantProfile.smoker = updateUserDto.smoker;
      if (updateUserDto.hobbies)
        user.tenantProfile.hobbies = updateUserDto.hobbies;
      if (updateUserDto.ideal_living_environment)
        user.tenantProfile.ideal_living_environment =
          updateUserDto.ideal_living_environment;
      if (updateUserDto.additional_info)
        user.tenantProfile.additional_info = updateUserDto.additional_info;

      await this.tenantProfileRepository.save(user.tenantProfile);
    } else if (user.role === "operator" && user.operatorProfile) {
      if (updateUserDto.phone) user.operatorProfile.phone = updateUserDto.phone;
      if (updateUserDto.company_name)
        user.operatorProfile.company_name = updateUserDto.company_name;
      if (updateUserDto.business_address)
        user.operatorProfile.business_address = updateUserDto.business_address;
      if (updateUserDto.business_description)
        user.operatorProfile.business_description =
          updateUserDto.business_description;

      await this.operatorProfileRepository.save(user.operatorProfile);
    }

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      select: [
        "id",
        "email",
        "role",
        "status",
        "full_name",
        "created_at",
        "updated_at",
      ],
    });
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

    // Manually delete shortlists first (since they don't have cascade)
    if (user.shortlists && user.shortlists.length > 0) {
      await this.userRepository.manager.delete("shortlist", { userId: id });
    }

    // Delete user - cascading will handle preferences, tenantProfile, operatorProfile
    await this.userRepository.remove(user);
  }

  async findAllPaginated({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "created_at",
    order = "DESC",
  }) {
    const skip = (page - 1) * limit;

    // Validate sortBy field to prevent SQL injection and errors
    const validSortFields = [
      "id",
      "email",
      "role",
      "status",
      "full_name",
      "created_at",
      "updated_at",
    ];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "created_at";

    // Validate order direction
    const safeOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Check if full_name column exists in users table
    const hasFullNameColumn = await this.userRepository.manager.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'full_name'
    `);

    const query = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.tenantProfile", "tenantProfile")
      .leftJoinAndSelect("user.operatorProfile", "operatorProfile");

    if (search) {
      if (hasFullNameColumn.length > 0) {
        // Use user.full_name if column exists
        query.where(
          "user.full_name ILIKE :search OR user.email ILIKE :search",
          {
            search: `%${search}%`,
          }
        );
      } else {
        // Fallback to profile names if full_name doesn't exist yet
        query.where(
          "tenantProfile.full_name ILIKE :search OR operatorProfile.full_name ILIKE :search OR user.email ILIKE :search",
          { search: `%${search}%` }
        );
      }
    }

    // Safe sorting with column existence check
    if (safeSortBy === "full_name" && hasFullNameColumn.length === 0) {
      // If trying to sort by full_name but column doesn't exist, use created_at
      query.orderBy("user.created_at", safeOrder as any);
    } else {
      query.orderBy(`user.${safeSortBy}`, safeOrder as any);
    }

    query.skip(skip).take(limit);

    const [users, total] = await query.getManyAndCount();

    // Add phone numbers from profiles to users for easy access
    const usersWithPhone = users.map((user) => {
      if (user.tenantProfile?.phone) {
        (user as any).phone = user.tenantProfile.phone;
      } else if (user.operatorProfile?.phone) {
        (user as any).phone = user.operatorProfile.phone;
      }
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
    if (dto.full_name !== undefined) user.full_name = dto.full_name;

    // Handle role changes
    if (dto.role !== undefined && dto.role !== oldRole) {
      user.role = dto.role;

      // If changing to tenant but no tenant profile exists, create one
      if (dto.role === "tenant" && !user.tenantProfile) {
        const tenantProfile = this.tenantProfileRepository.create({
          user: user,
          full_name: user.full_name,
        });
        user.tenantProfile =
          await this.tenantProfileRepository.save(tenantProfile);
      }

      // If changing to operator but no operator profile exists, create one
      if (dto.role === "operator" && !user.operatorProfile) {
        const operatorProfile = this.operatorProfileRepository.create({
          user: user,
          full_name: user.full_name,
        });
        user.operatorProfile =
          await this.operatorProfileRepository.save(operatorProfile);
      }
    }

    // Handle phone number updates in the appropriate profile
    if (dto.phone !== undefined) {
      if (user.role === "tenant" && user.tenantProfile) {
        user.tenantProfile.phone = dto.phone;
        await this.tenantProfileRepository.save(user.tenantProfile);
      } else if (user.role === "operator" && user.operatorProfile) {
        user.operatorProfile.phone = dto.phone;
        await this.operatorProfileRepository.save(user.operatorProfile);
      }
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

    const user = this.userRepository.create({
      email: dto.email,
      role: dto.role || "tenant",
      status: "active",
      password: await bcrypt.hash(dto.password, 10),
      full_name: dto.full_name,
    });
    const savedUser = await this.userRepository.save(user);

    // Create profile based on role
    if (dto.role === "tenant") {
      const tenantProfile = this.tenantProfileRepository.create({
        user: savedUser,
      });
      await this.tenantProfileRepository.save(tenantProfile);
    } else if (dto.role === "operator") {
      const operatorProfile = this.operatorProfileRepository.create({
        user: savedUser,
      });
      await this.operatorProfileRepository.save(operatorProfile);
    }

    return savedUser;
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
      // Delete related data in the correct order to avoid foreign key constraint violations

      // Delete shortlists first (they reference user)
      if (user.shortlists && user.shortlists.length > 0) {
        await queryRunner.manager.delete("shortlist", { userId: id });
      }

      // Delete any properties owned by the user (if they are an operator)
      // This should be done before deleting profiles
      await queryRunner.manager.delete("properties", { operator_id: id });

      // Delete any favourites by the user
      await queryRunner.manager.delete("favourites", { userId: id });

      // Delete tenant profile (they reference user via userId)
      if (user.tenantProfile) {
        await queryRunner.manager.delete("tenant_profiles", { userId: id });
      }

      // Delete operator profile (they reference user via userId)
      if (user.operatorProfile) {
        await queryRunner.manager.delete("operator_profiles", { userId: id });
      }

      // Delete preferences (they reference user via user_id)
      // This should be done last among related entities since user has cascade to preferences
      if (user.preferences) {
        await queryRunner.manager.delete("preferences", { user_id: id });
      }

      // Finally delete the user
      await queryRunner.manager.delete("users", { id: id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error deleting user:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update the user's role
    await this.userRepository.update(userId, { role });

    // Return the updated user
    return this.findOne(userId);
  }
}
