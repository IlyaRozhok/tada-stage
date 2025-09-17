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
    console.log("🔍 Registering user with email:", email, "role:", role);

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

      console.log("🔑 Generated tokens for user:", savedUser.id);
      console.log("🔑 Access token:", accessToken);

      return {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          role: savedUser.role,
          status: savedUser.status,
          full_name: savedUser.full_name,
          avatar_url: savedUser.avatar_url,
          provider: savedUser.provider,
          google_id: savedUser.google_id,
          email_verified: savedUser.email_verified,
          created_at: savedUser.created_at,
          updated_at: savedUser.updated_at,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
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
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        provider: user.provider,
        google_id: user.google_id,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(user: User) {
    const accessToken = this.authTokenService.generateAccessToken(user);
    const refreshToken = this.authTokenService.generateRefreshToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async findUserWithProfile(userId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
    });
  }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  }

  // Session management
  async logout(userId: string, token: string) {
    return this.authTokenService.invalidateToken(userId, token);
  }

  async logoutAllDevices(userId: string) {
    return this.authTokenService.invalidateAllUserTokens(userId);
  }

  async logoutOtherDevices(userId: string, currentToken: string) {
    return this.authTokenService.invalidateOtherUserTokens(
      userId,
      currentToken
    );
  }

  async getUserSessions(userId: string) {
    return this.authTokenService.getUserSessions(userId);
  }

  async invalidateSession(userId: string, sessionId: string) {
    return this.authTokenService.invalidateSession(userId, sessionId);
  }

  async updateSessionActivity(userId: string, token: string) {
    return this.authTokenService.updateSessionActivity(userId, token);
  }

  // Google OAuth methods
  async googleAuth(googleUser: any): Promise<User> {
    // Find or create user from Google data
    let user = await this.userRepository.findOne({
      where: { google_id: googleUser.google_id },
    });

    if (!user) {
      // Create new user from Google data
      user = this.userRepository.create({
        email: googleUser.email.toLowerCase(),
        google_id: googleUser.google_id,
        full_name: googleUser.full_name,
        avatar_url: googleUser.avatar_url,
        email_verified: googleUser.email_verified,
        provider: "google",
        role: UserRole.Tenant, // Default role
        status: UserStatus.Active,
      });

      user = await this.userRepository.save(user);

      // Create tenant profile for Google users
      await this.createTenantProfile(user);
    } else {
      // Update existing user with latest Google data
      user.full_name = googleUser.full_name;
      user.avatar_url = googleUser.avatar_url;
      user.email_verified = googleUser.email_verified;
      user = await this.userRepository.save(user);
    }

    return user;
  }

  async createGoogleUserFromTempToken(tempToken: string, role: UserRole) {
    const tokenInfo = await this.authTokenService.getTempTokenInfo(tempToken);

    if (!tokenInfo) {
      throw new BadRequestException("Invalid temporary token");
    }

    const user = this.userRepository.create({
      email: tokenInfo.googleUserData.email,
      google_id: tokenInfo.googleUserData.google_id,
      full_name: tokenInfo.googleUserData.full_name,
      avatar_url: tokenInfo.googleUserData.avatar_url,
      email_verified: tokenInfo.googleUserData.email_verified,
      provider: "google",
      role: role,
      status: UserStatus.Active,
    });

    const savedUser = await this.userRepository.save(user);

    if (role === UserRole.Tenant) {
      await this.createTenantProfile(savedUser);
    } else if (role === UserRole.Operator) {
      await this.createOperatorProfile(savedUser);
    }

    return savedUser;
  }

  async generateTokens(user: User) {
    const accessToken = this.authTokenService.generateAccessToken(user);
    const refreshToken = this.authTokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Profile creation methods
  private async createTenantProfile(user: User): Promise<void> {
    const tenantProfile = this.tenantProfileRepository.create({
      userId: user.id,
      full_name: null,
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

  private async createOperatorProfile(user: User): Promise<void> {
    const operatorProfile = this.operatorProfileRepository.create({
      userId: user.id,
      full_name: null,
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
