import { Injectable } from "@nestjs/common";
import { User, UserRole } from "../../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserProfileService } from "./services/user-profile.service";
import { UserRoleService } from "./services/user-role.service";
import { UserQueryService } from "./services/user-query.service";
import { UserAdminService } from "./services/user-admin.service";

@Injectable()
export class UsersService {
  constructor(
    private userProfileService: UserProfileService,
    private userRoleService: UserRoleService,
    private userQueryService: UserQueryService,
    private userAdminService: UserAdminService
  ) {}

  /**
   * Найти пользователя по ID
   */
  async findOne(id: string): Promise<User> {
    return this.userQueryService.findOneWithProfiles(id);
  }

  /**
   * Найти пользователя по email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userQueryService.findByEmail(email);
  }

  /**
   * Получить всех пользователей с пагинацией
   */
  async findAllPaginated(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    search?: string;
    role?: string;
  }) {
    return this.userQueryService.findAllPaginated(params);
  }

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userQueryService.findOneWithProfiles(id);

    // Обновить базовую информацию пользователя
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.status) user.status = updateUserDto.status;

    // Обновить профиль в зависимости от роли
    if (user.role === UserRole.Tenant) {
      await this.userProfileService.updateTenantProfile(user, updateUserDto);

      // Обновить предпочтения если нужно
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

    return user;
  }

  /**
   * Удалить аккаунт пользователя
   */
  async deleteAccount(id: string): Promise<void> {
    const user = await this.userQueryService.findOneForDeletion(id);

    // Удалить все связанные данные
    await this.userProfileService.deleteUserData(user);
  }

  /**
   * Изменить роль пользователя
   */
  async updateUserRole(userId: string, role: UserRole | string): Promise<User> {
    return this.userRoleService.updateUserRole(userId, role);
  }

  // Административные методы

  /**
   * Создать пользователя (админ)
   */
  async adminCreateUser(dto: CreateUserDto): Promise<User> {
    return this.userAdminService.createUser(dto);
  }

  /**
   * Обновить пользователя (админ)
   */
  async adminUpdateUser(id: string, dto: any): Promise<User> {
    return this.userAdminService.updateUser(id, dto);
  }

  /**
   * Удалить пользователя (админ)
   */
  async adminDeleteUser(id: string): Promise<void> {
    return this.userAdminService.deleteUser(id);
  }

  /**
   * Изменить роль пользователя (админ)
   */
  async adminChangeUserRole(
    userId: string,
    newRole: UserRole | string
  ): Promise<User> {
    return this.userAdminService.changeUserRole(userId, newRole);
  }
}
