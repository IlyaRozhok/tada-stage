import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../../entities/user.entity";
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
  // In-memory storage for sessions
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

    console.log("🔑 Generating access token for user:", user.id, "payload:", payload);

    const token = this.jwtService.sign(payload, {
      expiresIn: "24h",
    });

    console.log("🔑 Generated token:", token);
    return token;
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

  // Session management
  createSession(
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

  getUserSessions(userId: string): SessionData[] {
    return this.sessions.get(userId) || [];
  }

  invalidateToken(userId: string, token: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const filteredSessions = userSessions.filter(
      (session) => session.token !== token
    );
    this.sessions.set(userId, filteredSessions);
  }

  invalidateAllUserTokens(userId: string): void {
    this.sessions.delete(userId);
  }

  invalidateOtherUserTokens(userId: string, currentToken: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const currentSession = userSessions.find(
      (session) => session.token === currentToken
    );
    if (currentSession) {
      this.sessions.set(userId, [currentSession]);
    }
  }

  invalidateSession(userId: string, sessionId: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const filteredSessions = userSessions.filter(
      (session) => session.id !== sessionId
    );
    this.sessions.set(userId, filteredSessions);
  }

  updateSessionActivity(userId: string, token: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const session = userSessions.find((s) => s.token === token);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  // Google OAuth temporary tokens
  createTempGoogleToken(googleUserData: any): string {
    const tokenId = uuidv4();
    const tempToken: TempGoogleToken = {
      id: tokenId,
      googleUserData: {
        google_id: googleUserData.google_id,
        email: googleUserData.email,
        full_name: googleUserData.full_name,
        avatar_url: googleUserData.avatar_url || null,
        email_verified: true,
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };

    this.tempGoogleTokens.set(tokenId, tempToken);
    return tokenId;
  }

  getTempGoogleToken(tokenId: string): TempGoogleToken | null {
    const token = this.tempGoogleTokens.get(tokenId);
    if (!token) return null;

    if (token.expiresAt < new Date()) {
      this.tempGoogleTokens.delete(tokenId);
      return null;
    }

    return token;
  }

  removeTempGoogleToken(tokenId: string): void {
    this.tempGoogleTokens.delete(tokenId);
  }

  getTempTokenInfo(tokenId: string): TempGoogleToken | null {
    return this.getTempGoogleToken(tokenId);
  }

  // Cleanup expired tokens
  cleanupExpiredTokens(): void {
    const now = new Date();

    // Cleanup temp Google tokens
    for (const [tokenId, token] of this.tempGoogleTokens.entries()) {
      if (token.expiresAt < now) {
        this.tempGoogleTokens.delete(tokenId);
      }
    }

    // Cleanup expired sessions
    for (const [userId, sessions] of this.sessions.entries()) {
      const activeSessions = sessions.filter(
        (session) =>
          session.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
      );
      if (activeSessions.length === 0) {
        this.sessions.delete(userId);
      } else {
        this.sessions.set(userId, activeSessions);
      }
    }
  }
}
