import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole, UserStatus } from "../../../entities/user.entity";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { USER_CONSTANTS } from "../../../common/constants/user.constants";

@Injectable()
export class AuthValidationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async validateRegistration(registerDto: RegisterDto): Promise<void> {
    const { email, password, role = UserRole.Tenant } = registerDto;

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException("Invalid email format");
    }

    // Validate password strength
    if (!this.isValidPassword(password)) {
      throw new BadRequestException(
        `Password must be at least ${USER_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`
      );
    }

    // Validate role
    if (!this.isValidRole(role)) {
      throw new BadRequestException("Invalid user role");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }
  }

  async validateLogin(loginDto: LoginDto): Promise<User> {
    const { email, password } = loginDto;

    console.log("🔍 Login attempt for email:", email, "password provided:", !!password);

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException("Invalid email format");
    }

    // Validate password
    if (!password || password.trim() === "") {
      throw new BadRequestException("Password is required");
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ["preferences", "tenantProfile", "operatorProfile"],
      select: ["id", "email", "password", "role", "status", "google_id", "created_at", "updated_at"],
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user has a password (for Google users)
    if (!user.password) {
      throw new UnauthorizedException("This account uses Google authentication");
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user is active
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException("Account is not active");
    }

    return user;
  }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= USER_CONSTANTS.PASSWORD_MIN_LENGTH;
  }

  private isValidRole(role: any): boolean {
    return Object.values(UserRole).includes(role);
  }
}

