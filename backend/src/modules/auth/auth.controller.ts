import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  Query,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // Check if user exists
  @Post("check-user")
  @HttpCode(HttpStatus.OK)
  async checkUser(@Body("email") email: string) {
    const exists = await this.authService.checkUserExists(email);
    return { exists };
  }

  // Universal auth endpoint
  @Post("authenticate")
  async authenticate(
    @Body()
    body: {
      email: string;
      password: string;
      role?: "tenant" | "operator";
      rememberMe?: boolean;
    }
  ) {
    const { email, password, role, rememberMe } = body;

    // Check if user exists
    const userExists = await this.authService.checkUserExists(email);

    if (userExists) {
      // User exists - attempt login
      return this.authService.login({ email, password });
    } else {
      // User doesn't exist - check if we have role for registration
      if (!role) {
        return {
          requiresRegistration: true,
          message: "Please select your account type to continue registration",
        };
      }

      // Proceed with registration
      return this.authService.register({
        email,
        password,
        role,
      });
    }
  }

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return result;
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User, @Req() req: Request) {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await this.authService.logout(user.id, token);
    }
    return { message: "Logged out successfully" };
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutAllDevices(user.id);
    return { message: "Logged out from all devices successfully" };
  }

  @Post("logout-others")
  @UseGuards(JwtAuthGuard)
  async logoutOthers(@CurrentUser() user: User, @Req() req: Request) {
    const currentToken = req.headers.authorization?.split(" ")[1];
    if (currentToken) {
      await this.authService.logoutOtherDevices(user.id, currentToken);
    }
    return { message: "Logged out from other devices successfully" };
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: User) {
    const sessions = await this.authService.getUserSessions(user.id);
    return { sessions };
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  async invalidateSession(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string
  ) {
    await this.authService.invalidateSession(user.id, sessionId);
    return { message: "Session invalidated successfully" };
  }

  @Post("activity")
  @UseGuards(JwtAuthGuard)
  async updateActivity(@CurrentUser() user: User, @Req() req: Request) {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await this.authService.updateSessionActivity(user.id, token);
    }
    return { message: "Activity updated" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    const fullUser = await this.authService.findUserWithProfile(user.id);
    return {
      user: {
        ...fullUser,
        full_name:
          fullUser.full_name ||
          fullUser.tenantProfile?.full_name ||
          fullUser.operatorProfile?.full_name ||
          null,
      },
    };
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  async refresh(@CurrentUser() user: User) {
    return this.authService.refresh(user);
  }

  // Google OAuth
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      console.log("🔍 Google callback started");
      console.log("User from strategy:", req.user);

      if (!req.user) {
        console.error("❌ No user data from Google strategy");
        return res.redirect(
          `${process.env.FRONTEND_URL}/app/auth/callback?success=false&error=${encodeURIComponent(
            "Authentication failed - no user data"
          )}`
        );
      }

      console.log("🔍 Processing Google user data through auth service...");

      // Use simplified Google auth flow
      const result = await this.authService.googleAuth(req.user);

      if (result.user && !result.isNewUser) {
        // Existing user - generate tokens and redirect
        console.log("✅ Existing user found:", {
          userId: result.user.id,
          userEmail: result.user.email,
          userRole: result.user.role,
        });

        console.log("🔍 Generating tokens for existing user...");
        const tokens = await this.authService.generateTokens(result.user);

        const callbackUrl = `${process.env.FRONTEND_URL}/app/auth/callback?token=${tokens.access_token}&success=true&isNewUser=false`;
        return res.redirect(callbackUrl);
      } else if (result.tempToken && result.isNewUser) {
        // New user - redirect to role selection with temp token
        console.log("🔄 New user detected - redirecting to role selection");
        console.log(`✅ Created temp token: ${result.tempToken}`);

        // Redirect directly to role selection page with temp token
        const callbackUrl = `${process.env.FRONTEND_URL}/auth/select-role?tempToken=${result.tempToken}`;
        return res.redirect(callbackUrl);
      }
    } catch (error: any) {
      console.error("❌ Google callback error:", error);
      console.error("Error stack:", error.stack);

      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      return res.redirect(
        `${process.env.FRONTEND_URL}/app/auth/callback?success=false&error=${encodeURIComponent(
          errorMessage
        )}`
      );
    }
  }

  @Post("set-role")
  @UseGuards(JwtAuthGuard)
  async setRole(
    @CurrentUser() user: any,
    @Body() body: { role: "tenant" | "operator" }
  ) {
    try {
      const { role } = body;

      if (!role || !["tenant", "operator"].includes(role)) {
        throw new BadRequestException(
          "Invalid role. Must be 'tenant' or 'operator'"
        );
      }

      const updatedUser = await this.authService.setUserRole(user.userId, role);

      return {
        message: "Role set successfully",
        user: updatedUser,
      };
    } catch (error) {
      console.error("Set role error:", error);
      throw error;
    }
  }

  @Get("temp-token/:token")
  async getTempTokenInfo(@Param("token") token: string) {
    try {
      console.log("🔍 Getting temp token info:", token);

      const tokenInfo = await this.authService.getTempTokenInfo(token);

      if (!tokenInfo) {
        throw new BadRequestException("Invalid or expired token");
      }

      return {
        success: true,
        googleData: {
          email: tokenInfo.googleUserData.email,
          full_name: tokenInfo.googleUserData.full_name,
          avatar_url: tokenInfo.googleUserData.avatar_url,
        },
        expiresAt: tokenInfo.expiresAt,
      };
    } catch (error) {
      console.error("❌ Get temp token info error:", error);
      throw error;
    }
  }

  @Post("create-google-user")
  async createGoogleUser(
    @Body() body: { tempToken: string; role: "tenant" | "operator" }
  ) {
    try {
      console.log(
        `🔍 Creating Google user with role: ${body.role} using temp token`
      );

      if (!body.tempToken || !body.role) {
        throw new BadRequestException("Temp token and role are required");
      }

      if (!["tenant", "operator"].includes(body.role)) {
        throw new BadRequestException("Role must be 'tenant' or 'operator'");
      }

      // Create user from temp token with role
      const user = await this.authService.createGoogleUserWithRole(
        body.tempToken,
        body.role
      );

      // Generate tokens
      const tokens = await this.authService.generateTokens(user);

      console.log(
        `✅ Google user created successfully: ${user.email} with role: ${user.role}`
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url: user.avatar_url,
          tenantProfile: user.tenantProfile || null,
          operatorProfile: user.operatorProfile || null,
          preferences: user.preferences || null,
        },
        access_token: tokens.access_token,
      };
    } catch (error: any) {
      console.error("❌ Error creating Google user:", error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(error.message || "Failed to create user");
    }
  }
}
