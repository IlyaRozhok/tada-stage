import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { TenantProfile } from "../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../entities/operator-profile.entity";
import { Preferences } from "../../entities/preferences.entity";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

// Local Google user data type (replaces removed service)
type GoogleUserData = {
  google_id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  email_verified: boolean;
};

// Simplified session structure - only for admin sessions management
export interface SessionData {
  id: string;
  token: string;
  deviceInfo?: string;
  lastActivity: Date;
  createdAt: Date;
}

// Temporary token for OAuth role selection
export interface TempGoogleToken {
  id: string;
  googleUserData: GoogleUserData;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  // In-memory storage for admin sessions only
  private sessions = new Map<string, SessionData[]>();

  // Temporary storage for Google OAuth role selection
  private tempGoogleTokens = new Map<string, TempGoogleToken>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantProfile)
    private tenantProfileRepository: Repository<TenantProfile>,
    @InjectRepository(OperatorProfile)
    private operatorProfileRepository: Repository<OperatorProfile>,
    @InjectRepository(Preferences)
    private preferencesRepository: Repository<Preferences>,
    private jwtService: JwtService
  ) {}

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, role = UserRole.Tenant } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role as UserRole,
      status: UserStatus.Active,
    });

    try {
      const savedUser = await this.userRepository.save(user);

      // Create profile based on role
      if (role === UserRole.Tenant) {
        const tenantProfile = this.tenantProfileRepository.create({
          user: savedUser,
        });
        await this.tenantProfileRepository.save(tenantProfile);

        // Create preferences for tenant
        const preferences = this.preferencesRepository.create({
          user: savedUser,
        });
        await this.preferencesRepository.save(preferences);
      } else if (role === UserRole.Operator) {
        const operatorProfile = this.operatorProfileRepository.create({
          user: savedUser,
        });
        await this.operatorProfileRepository.save(operatorProfile);
      }

      // Generate JWT token
      const payload = {
        sub: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      };
      const access_token = this.jwtService.sign(payload);

      // Store session
      const sessionId = uuidv4();
      const sessionData: SessionData = {
        id: sessionId,
        token: access_token,
        lastActivity: new Date(),
        createdAt: new Date(),
      };

      if (!this.sessions.has(savedUser.id)) {
        this.sessions.set(savedUser.id, []);
      }
      this.sessions.get(savedUser.id)!.push(sessionData);

      // Return user without password
      const { password: _, ...userWithoutPassword } = savedUser;
      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new InternalServerErrorException("Failed to register user");
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email with password
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ["tenantProfile", "operatorProfile"],
      select: [
        "id",
        "email",
        "password",
        "role",
        "status",
        "full_name",
        "provider",
        "google_id",
        "avatar_url",
        "email_verified",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check password
    if (!user.password) {
      throw new UnauthorizedException(
        "This account was created with Google. Please use Google sign-in or contact support to set a password."
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "Password is incorrect. Try again or create a new account."
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      throw new UnauthorizedException("Account is not active");
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    // Store session
    const sessionId = uuidv4();
    const sessionData: SessionData = {
      id: sessionId,
      token: access_token,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    if (!this.sessions.has(user.id)) {
      this.sessions.set(user.id, []);
    }
    this.sessions.get(user.id)!.push(sessionData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async logout(userId: string, token: string): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const filteredSessions = sessions.filter((s) => s.token !== token);
      this.sessions.set(userId, filteredSessions);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    this.sessions.delete(userId);
  }

  async logoutOtherDevices(
    userId: string,
    currentToken: string
  ): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const currentSession = sessions.find((s) => s.token === currentToken);
      this.sessions.set(userId, currentSession ? [currentSession] : []);
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    return this.sessions.get(userId) || [];
  }

  async invalidateSession(userId: string, sessionId: string): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const filteredSessions = sessions.filter((s) => s.id !== sessionId);
      this.sessions.set(userId, filteredSessions);
    }
  }

  async updateSessionActivity(userId: string, token: string): Promise<void> {
    const sessions = this.sessions.get(userId);
    if (sessions) {
      const session = sessions.find((s) => s.token === token);
      if (session) {
        session.lastActivity = new Date();
      }
    }
  }

  async findUserWithProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile", "preferences"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async refresh(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  /**
   * Simplified Google user check - either return existing user or create temp token
   */
  async checkGoogleUser(googleUser: any): Promise<{
    user?: User;
    tempToken?: string;
  }> {
    try {
      if (!googleUser || !googleUser.email || !googleUser.google_id) {
        throw new BadRequestException("Invalid Google user data");
      }

      const { email, google_id } = googleUser;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });

      if (existingUser) {
        // Update Google ID if not set
        if (!existingUser.google_id) {
          existingUser.google_id = google_id;
          await this.userRepository.save(existingUser);
        }

        return { user: existingUser };
      }

      // New user - create temporary token for role selection
      const tempTokenId = uuidv4();
      const tempToken: TempGoogleToken = {
        id: tempTokenId,
        googleUserData: googleUser,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      };

      this.tempGoogleTokens.set(tempTokenId, tempToken);

      // Clean up expired tokens
      this.cleanupExpiredTokens();

      return { tempToken: tempTokenId };
    } catch (error) {
      throw new InternalServerErrorException("Failed to check user");
    }
  }

  /**
   * Clean up expired temporary tokens
   */
  private cleanupExpiredTokens() {
    const now = new Date();
    for (const [tokenId, token] of this.tempGoogleTokens.entries()) {
      if (token.expiresAt < now) {
        this.tempGoogleTokens.delete(tokenId);
      }
    }
  }

  /**
   * Get temporary token information for role selection page
   */
  getTempTokenInfo(tempToken: string): TempGoogleToken | null {
    const tokenData = this.tempGoogleTokens.get(tempToken);

    if (!tokenData) {
      return null;
    }

    if (tokenData.expiresAt < new Date()) {
      this.tempGoogleTokens.delete(tempToken);
      return null;
    }

    return tokenData;
  }

  /**
   * Create Google user with role using temporary token
   */
  async createGoogleUserFromTempToken(
    tempToken: string,
    role: UserRole.Tenant | UserRole.Operator
  ) {
    try {
      // Get and validate temp token
      const tokenData = this.tempGoogleTokens.get(tempToken);
      if (!tokenData) {
        throw new BadRequestException("Invalid or expired token");
      }

      if (tokenData.expiresAt < new Date()) {
        this.tempGoogleTokens.delete(tempToken);
        throw new BadRequestException("Token has expired");
      }

      const { email, google_id, full_name, avatar_url } =
        tokenData.googleUserData;

      // Double-check user doesn't exist
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        // Clean up temp token
        this.tempGoogleTokens.delete(tempToken);
        return existingUser;
      }

      // Create user with role
      const user = this.userRepository.create({
        email: email.toLowerCase(),
        google_id,
        full_name: full_name || null,
        avatar_url: avatar_url || null,
        role: role as UserRole,
        status: UserStatus.Active,
        // Generate random password for OAuth users
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      });

      const savedUser = await this.userRepository.save(user);

      // Create role-specific profiles
      if (role === UserRole.Tenant) {
        const tenantProfile = this.tenantProfileRepository.create({
          user: savedUser,
        });
        await this.tenantProfileRepository.save(tenantProfile);

        const preferences = this.preferencesRepository.create({
          user: savedUser,
        });
        await this.preferencesRepository.save(preferences);
      } else if (role === UserRole.Operator) {
        const operatorProfile = this.operatorProfileRepository.create({
          user: savedUser,
        });
        await this.operatorProfileRepository.save(operatorProfile);
      }

      // Return user with relations
      return await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });
    } catch (error) {
      throw new InternalServerErrorException("Failed to create user");
    }
  }

  /**
   * Updated Google Auth method for simplified OAuth flow
   */
  async googleAuth(googleUser: any) {
    try {
      // Use the new method to check user
      const result = await this.checkGoogleUser(googleUser);

      if (result.user) {
        // Existing user - generate tokens and return
        return {
          user: result.user,
          isNewUser: false,
        };
      } else if (result.tempToken) {
        // New user - return temp token for role selection
        return {
          tempToken: result.tempToken,
          isNewUser: true,
        };
      }

      throw new InternalServerErrorException("Unexpected auth result");
    } catch (error) {
      throw error;
    }
  }

  async setUserRole(userId: string, role: UserRole.Tenant | UserRole.Operator) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["tenantProfile", "operatorProfile"],
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      if (user.role) {
        throw new BadRequestException("User already has a role assigned");
      }

      // Set the role
      user.role = role as UserRole;
      await this.userRepository.save(user);

      // Create appropriate profile
      if (role === UserRole.Tenant) {
        const tenantProfile = this.tenantProfileRepository.create({
          user: user,
          full_name: user.full_name || null,
        });
        await this.tenantProfileRepository.save(tenantProfile);

        // Create preferences for tenant
        const preferences = this.preferencesRepository.create({
          user: user,
        });
        await this.preferencesRepository.save(preferences);
      } else if (role === UserRole.Operator) {
        const operatorProfile = this.operatorProfileRepository.create({
          user: user,
          full_name: user.full_name || null,
        });
        await this.operatorProfileRepository.save(operatorProfile);
      }

      // Return updated user with relations
      return await this.userRepository.findOne({
        where: { id: userId },
        relations: ["tenantProfile", "operatorProfile", "preferences"],
      });
    } catch (error) {
      throw error;
    }
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ["tenantProfile", "operatorProfile"],
    });
  }

  async storeGoogleDataTemporarily(googleData: any): Promise<string> {
    // Deprecated method: previously used PendingGoogleRegistrationService
    // Keeping signature for compatibility; now returns a generated token using internal temp storage
    const googleUserData: GoogleUserData = {
      google_id: googleData.google_id,
      email: googleData.email,
      full_name: googleData.full_name,
      avatar_url: googleData.avatar_url,
      email_verified: googleData.email_verified || true,
    };

    const tempTokenId = uuidv4();
    const tempToken: TempGoogleToken = {
      id: tempTokenId,
      googleUserData,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
    this.tempGoogleTokens.set(tempTokenId, tempToken);
    return tempTokenId;
  }

  /**
   * Create Google user from temporary token with role selection
   * This replaces the old registration-based approach
   */
  async createGoogleUserWithRole(
    tempToken: string,
    role: UserRole.Tenant | UserRole.Operator
  ) {
    // Use the new method that handles temp tokens
    const user = await this.createGoogleUserFromTempToken(tempToken, role);

    // Clean up temp token after successful creation
    this.tempGoogleTokens.delete(tempToken);

    return user;
  }
}
