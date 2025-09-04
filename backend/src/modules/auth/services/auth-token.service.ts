import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User, UserRole } from "../../../entities/user.entity";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export interface SessionData {
  id: string;
  token: string;
  deviceInfo?: string;
  lastActivity: Date;
  createdAt: Date;
}

export interface TempGoogleToken {
  id: string;
  googleUserData: {
    google_id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    email_verified: boolean;
  };
  expiresAt: Date;
}

@Injectable()
export class AuthTokenService {
  // In-memory storage for admin sessions only
  private sessions = new Map<string, SessionData[]>();

  // Temporary storage for Google OAuth role selection
  private tempGoogleTokens = new Map<string, TempGoogleToken>();

  constructor(private jwtService: JwtService) {}

  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return this.jwtService.sign(payload, {
      expiresIn: "24h",
    });
  }

  generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: "refresh",
    };

    return this.jwtService.sign(payload, {
      expiresIn: "7d",
    });
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  generateTempToken(): string {
    return uuidv4();
  }

  generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // Admin session management
  createAdminSession(
    userId: string,
    token: string,
    deviceInfo?: string
  ): SessionData {
    const session: SessionData = {
      id: uuidv4(),
      token,
      deviceInfo,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    const userSessions = this.sessions.get(userId) || [];
    userSessions.push(session);
    this.sessions.set(userId, userSessions);

    return session;
  }

  getAdminSessions(userId: string): SessionData[] {
    return this.sessions.get(userId) || [];
  }

  removeAdminSession(userId: string, sessionId: string): boolean {
    const userSessions = this.sessions.get(userId) || [];
    const filteredSessions = userSessions.filter(
      (session) => session.id !== sessionId
    );

    if (filteredSessions.length !== userSessions.length) {
      this.sessions.set(userId, filteredSessions);
      return true;
    }
    return false;
  }

  clearAllAdminSessions(userId: string): void {
    this.sessions.delete(userId);
  }

  // Google OAuth temporary tokens
  createTempGoogleToken(
    googleUserData: TempGoogleToken["googleUserData"]
  ): string {
    const tokenId = uuidv4();
    const tempToken: TempGoogleToken = {
      id: tokenId,
      googleUserData,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };

    this.tempGoogleTokens.set(tokenId, tempToken);
    return tokenId;
  }

  getTempGoogleToken(tokenId: string): TempGoogleToken | null {
    const token = this.tempGoogleTokens.get(tokenId);

    if (!token) {
      return null;
    }

    // Check if token is expired
    if (token.expiresAt < new Date()) {
      this.tempGoogleTokens.delete(tokenId);
      return null;
    }

    return token;
  }

  removeTempGoogleToken(tokenId: string): boolean {
    return this.tempGoogleTokens.delete(tokenId);
  }

  // Cleanup expired tokens
  cleanupExpiredTokens(): void {
    const now = new Date();

    // Cleanup expired Google tokens
    for (const [tokenId, token] of this.tempGoogleTokens.entries()) {
      if (token.expiresAt < now) {
        this.tempGoogleTokens.delete(tokenId);
      }
    }

    // Cleanup expired admin sessions (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const [userId, sessions] of this.sessions.entries()) {
      const activeSessions = sessions.filter(
        (session) => session.createdAt > thirtyDaysAgo
      );
      if (activeSessions.length !== sessions.length) {
        this.sessions.set(userId, activeSessions);
      }
    }
  }
}
