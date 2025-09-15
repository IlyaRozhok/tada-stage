import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any) {
    console.log("🔍 JWT Guard - err:", err, "user:", user, "info:", info);

    if (err || !user) {
      if (info && info.message === "No token found") {
        console.error("❌ JWT Guard: No token found");
        throw new UnauthorizedException("No token found");
      }
      console.error("❌ JWT Guard: Invalid token or user not found");
      throw err || new UnauthorizedException("Invalid token");
    }

    console.log("✅ JWT Guard: User authenticated successfully:", user.id);
    return user;
  }
}
