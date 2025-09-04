import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { Preferences } from "../../entities/preferences.entity";
import { AuthValidationService } from "./services/auth-validation.service";
import { AuthTokenService } from "./services/auth-token.service";
import { USER_CONSTANTS } from "../../common/constants/user.constants";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    private authValidationService: AuthValidationService,
    private authTokenService: AuthTokenService
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role = UserRole.Tenant } = registerDto;
    console.log("🔍 Registering user with role:", role);

    // Validate registration data
    await this.authValidationService.validateRegistration(registerDto);

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      USER_CONSTANTS.PASSWORD_SALT_ROUNDS
    );

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role as UserRole,
      status: UserStatus.Active,
    });

    try {
      const savedUser = await this.userRepository.save(user);

      // Create appropriate profile based on role
      if (role === UserRole.Tenant) {
        await this.createTenantProfile(savedUser);
      } else if (role === UserRole.Operator) {
        await this.createOperatorProfile(savedUser);
      }

      // Generate tokens
      const accessToken = this.authTokenService.generateAccessToken(savedUser);
      const refreshToken =
        this.authTokenService.generateRefreshToken(savedUser);

      return {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          role: savedUser.role,
          status: savedUser.status,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Error during registration:", error);
      throw new InternalServerErrorException("Registration failed");
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Validate login credentials
    const user = await this.authValidationService.validateLogin(loginDto);

    // Generate tokens
    const accessToken = this.authTokenService.generateAccessToken(user);
    const refreshToken = this.authTokenService.generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.authTokenService.verifyToken(refreshToken);

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.Active) {
        throw new UnauthorizedException("User not found or inactive");
      }

      const newAccessToken = this.authTokenService.generateAccessToken(user);
      const newRefreshToken = this.authTokenService.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async checkUserExists(email: string): Promise<boolean> {
    return this.authValidationService.checkUserExists(email);
  }

  // Admin session management
  async createAdminSession(userId: string, deviceInfo?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.Admin) {
      throw new UnauthorizedException("Admin access required");
    }

    const token = this.authTokenService.generateSecureToken();
    const session = this.authTokenService.createAdminSession(
      userId,
      token,
      deviceInfo
    );

    return {
      sessionId: session.id,
      token,
      createdAt: session.createdAt,
    };
  }

  async getAdminSessions(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.Admin) {
      throw new UnauthorizedException("Admin access required");
    }

    return this.authTokenService.getAdminSessions(userId);
  }

  async removeAdminSession(userId: string, sessionId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.Admin) {
      throw new UnauthorizedException("Admin access required");
    }

    return this.authTokenService.removeAdminSession(userId, sessionId);
  }

  async clearAllAdminSessions(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.Admin) {
      throw new UnauthorizedException("Admin access required");
    }

    this.authTokenService.clearAllAdminSessions(userId);
  }

  // Google OAuth methods
  async createTempGoogleToken(googleUserData: any) {
    return this.authTokenService.createTempGoogleToken(googleUserData);
  }

  async getTempGoogleToken(tokenId: string) {
    return this.authTokenService.getTempGoogleToken(tokenId);
  }

  async removeTempGoogleToken(tokenId: string) {
    return this.authTokenService.removeTempGoogleToken(tokenId);
  }

  // Cleanup method
  async cleanupExpiredTokens() {
    this.authTokenService.cleanupExpiredTokens();
  }

  // Private helper methods
  private async createTenantProfile(user: User): Promise<void> {
    const tenantProfile = this.tenantProfileRepository.create({
      userId: user.id,
    });
    await this.tenantProfileRepository.save(tenantProfile);

    const preferences = this.preferencesRepository.create({
      user_id: user.id,
    });
    await this.preferencesRepository.save(preferences);
  }

  private async createOperatorProfile(user: User): Promise<void> {
    const operatorProfile = this.operatorProfileRepository.create({
      userId: user.id,
    });
    await this.operatorProfileRepository.save(operatorProfile);
  }
}
