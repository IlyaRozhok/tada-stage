import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";
import { TenantProfile } from "../../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../../entities/operator-profile.entity";
import { Preferences } from "../../../entities/preferences.entity";

@Injectable()
export class UserQueryService {
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
   * Найти пользователя по ID с полными данными
   */
  async findOneWithProfiles(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      select: ["id", "email", "role", "status", "created_at", "updated_at"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    this.addPhoneToUser(user);
    return user;
  }

  /**
   * Найти пользователя по email
   */
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

  /**
   * Получить всех пользователей с пагинацией
   */
  async findAllPaginated({
    page = 1,
    limit = 10,
    sortBy = "created_at",
    sortOrder = "DESC",
    search = "",
    role = "",
  }: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    search?: string;
    role?: string;
  }) {
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.tenantProfile", "tenantProfile")
      .leftJoinAndSelect("user.operatorProfile", "operatorProfile")
      .leftJoinAndSelect("user.preferences", "preferences");

    // Поиск по email или имени
    if (search) {
      queryBuilder.andWhere(
        "(user.email ILIKE :search OR tenantProfile.full_name ILIKE :search OR operatorProfile.full_name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Фильтр по роли
    if (role) {
      queryBuilder.andWhere("user.role = :role", { role });
    }

    // Сортировка
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Пагинация
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    // Добавить телефон к каждому пользователю
    users.forEach((user) => this.addPhoneToUser(user));

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Найти пользователя для удаления (с полными связями)
   */
  async findOneForDeletion(id: string): Promise<User> {
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

    return user;
  }

  /**
   * Добавить телефон к объекту пользователя из профиля
   */
  private addPhoneToUser(user: User): void {
    // Phone is now a computed property in User entity
    // No need to manually assign it
  }
}
