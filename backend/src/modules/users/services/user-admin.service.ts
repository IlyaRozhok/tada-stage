import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "../../../entities/user.entity";
import { TenantProfile } from "../../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../../entities/operator-profile.entity";
import { Preferences } from "../../../entities/preferences.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { USER_CONSTANTS } from "../../../common/constants/user.constants";

@Injectable()
export class UserAdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>
  ) {}

  /**
   * Создать пользователя администратором
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const { email, password, role = UserRole.Tenant } = dto;

    // Проверить, что email уникален
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Захешировать пароль
    const hashedPassword = await bcrypt.hash(
      password,
      USER_CONSTANTS.PASSWORD_SALT_ROUNDS
    );

    // Создать пользователя
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role as UserRole,
      status: UserStatus.Active,
    });

    const savedUser = await this.userRepository.save(user);

    // Создать профиль в зависимости от роли
    if (role === UserRole.Tenant) {
      await this.createTenantProfile(savedUser);
    } else if (role === UserRole.Operator) {
      await this.createOperatorProfile(savedUser);
    }

    return savedUser;
  }

  /**
   * Обновить пользователя администратором
   */
  async updateUser(id: string, dto: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Обновить базовую информацию
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.status) user.status = dto.status;
    if (dto.role) user.role = dto.role;

    // Обновить пароль если предоставлен
    if (dto.password) {
      user.password = await bcrypt.hash(
        dto.password,
        USER_CONSTANTS.PASSWORD_SALT_ROUNDS
      );
    }

    return this.userRepository.save(user);
  }

  /**
   * Удалить пользователя администратором
   */
  async deleteUser(id: string): Promise<void> {
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

    // Удалить связанные данные
    if (user.preferences) {
      await this.preferencesRepository.remove(user.preferences);
    }

    if (user.tenantProfile) {
      await this.tenantProfileRepository.remove(user.tenantProfile);
    }

    if (user.operatorProfile) {
      await this.operatorProfileRepository.remove(user.operatorProfile);
    }

    // Удалить пользователя
    await this.userRepository.remove(user);
  }

  /**
   * Изменить роль пользователя
   */
  async changeUserRole(
    userId: string,
    newRole: UserRole | string
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile"],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const oldRole = user.role;
    user.role = newRole as UserRole;

    // Если роль изменилась, обновить профили
    if (oldRole !== newRole) {
      if (newRole === UserRole.Tenant && !user.tenantProfile) {
        await this.createTenantProfile(user);
      } else if (newRole === UserRole.Operator && !user.operatorProfile) {
        await this.createOperatorProfile(user);
      }
    }

    return this.userRepository.save(user);
  }

  /**
   * Создать профиль арендатора
   */
  private async createTenantProfile(user: User): Promise<void> {
    const tenantProfile = this.tenantProfileRepository.create({
      userId: user.id,
      full_name: "",
      phone: "",
      date_of_birth: null,
      nationality: "",
      occupation: "",
      industry: "",
      work_style: "",
      lifestyle: [],
      ideal_living_environment: "",
      additional_info: "",
      shortlisted_properties: [],
    });

    await this.tenantProfileRepository.save(tenantProfile);
  }

  /**
   * Создать профиль оператора
   */
  private async createOperatorProfile(user: User): Promise<void> {
    const operatorProfile = this.operatorProfileRepository.create({
      userId: user.id,
      full_name: "",
      phone: "",
      company_name: "",
      date_of_birth: null,
      nationality: "",
      business_address: "",
      company_registration: "",
      vat_number: "",
      license_number: "",
      years_experience: null,
      operating_areas: [],
      property_types: [],
      services: [],
      business_description: "",
      website: "",
      linkedin: "",
    });

    await this.operatorProfileRepository.save(operatorProfile);
  }
}
