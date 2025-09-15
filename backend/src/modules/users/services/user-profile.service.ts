import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../../../entities/user.entity";
import { TenantProfile } from "../../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../../entities/operator-profile.entity";
import { Preferences } from "../../../entities/preferences.entity";
import { UpdateUserDto } from "../dto/update-user.dto";

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>
  ) {}

  async updateTenantProfile(
    user: User,
    updateUserDto: UpdateUserDto
  ): Promise<void> {
    if (!user.tenantProfile) {
      throw new NotFoundException("Tenant profile not found");
    }

    const profile = user.tenantProfile;

    // Update basic profile fields
    if (updateUserDto.full_name) profile.full_name = updateUserDto.full_name;
    if (updateUserDto.phone) profile.phone = updateUserDto.phone;
    if (
      updateUserDto.date_of_birth &&
      updateUserDto.date_of_birth.trim() !== ""
    ) {
      profile.date_of_birth = new Date(updateUserDto.date_of_birth);
    }
    if (updateUserDto.nationality)
      profile.nationality = updateUserDto.nationality;
    if (updateUserDto.age_range) profile.age_range = updateUserDto.age_range;
    if (updateUserDto.occupation) profile.occupation = updateUserDto.occupation;
    if (updateUserDto.industry) profile.industry = updateUserDto.industry;
    if (updateUserDto.work_style) profile.work_style = updateUserDto.work_style;
    if (updateUserDto.lifestyle) profile.lifestyle = updateUserDto.lifestyle;
    if (updateUserDto.ideal_living_environment) {
      profile.ideal_living_environment = updateUserDto.ideal_living_environment;
    }
    if (updateUserDto.additional_info)
      profile.additional_info = updateUserDto.additional_info;

    await this.tenantProfileRepository.save(profile);
  }

  async updateOperatorProfile(
    user: User,
    updateUserDto: UpdateUserDto
  ): Promise<void> {
    if (!user.operatorProfile) {
      throw new NotFoundException("Operator profile not found");
    }

    const profile = user.operatorProfile;

    // Update basic profile fields
    if (updateUserDto.full_name) profile.full_name = updateUserDto.full_name;
    if (updateUserDto.phone) profile.phone = updateUserDto.phone;
    if (
      updateUserDto.date_of_birth &&
      updateUserDto.date_of_birth.trim() !== ""
    ) {
      profile.date_of_birth = new Date(updateUserDto.date_of_birth);
    }
    if (updateUserDto.nationality)
      profile.nationality = updateUserDto.nationality;
    if (updateUserDto.company_name)
      profile.company_name = updateUserDto.company_name;
    if (updateUserDto.business_address)
      profile.business_address = updateUserDto.business_address;
    if (updateUserDto.business_description) {
      profile.business_description = updateUserDto.business_description;
    }

    await this.operatorProfileRepository.save(profile);
  }

  async updatePreferences(
    user: User,
    updateUserDto: UpdateUserDto
  ): Promise<void> {
    if (!user.preferences) {
      throw new NotFoundException("Preferences not found");
    }

    const preferences = user.preferences;

    if (updateUserDto.pets !== undefined) preferences.pets = updateUserDto.pets;
    if (updateUserDto.smoker !== undefined) {
      preferences.smoker = updateUserDto.smoker ? "yes" : "no";
    }
    if (updateUserDto.hobbies) preferences.hobbies = updateUserDto.hobbies;

    await this.preferencesRepository.save(preferences);
  }

  async createTenantProfile(
    userId: string,
    fullName?: string
  ): Promise<TenantProfile> {
    const profile = this.tenantProfileRepository.create({
      userId,
      full_name: fullName,
    });
    return await this.tenantProfileRepository.save(profile);
  }

  async createOperatorProfile(
    userId: string,
    fullName?: string
  ): Promise<OperatorProfile> {
    const profile = this.operatorProfileRepository.create({
      userId,
      full_name: fullName,
    });
    return await this.operatorProfileRepository.save(profile);
  }

  async createPreferences(userId: string): Promise<Preferences> {
    const preferences = this.preferencesRepository.create({
      user_id: userId,
    });
    return await this.preferencesRepository.save(preferences);
  }

  async deleteUserData(user: User): Promise<void> {
    // Delete preferences
    if (user.preferences) {
      await this.preferencesRepository.remove(user.preferences);
    }

    // Delete tenant profile
    if (user.tenantProfile) {
      await this.tenantProfileRepository.remove(user.tenantProfile);
    }

    // Delete operator profile
    if (user.operatorProfile) {
      await this.operatorProfileRepository.remove(user.operatorProfile);
    }
  }
}

