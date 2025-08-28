import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private readonly configService: ConfigService,
  ) {
    const clientID = configService.get("GOOGLE_CLIENT_ID");
    const clientSecret = configService.get("GOOGLE_CLIENT_SECRET");
    const callbackURL = configService.get("GOOGLE_CALLBACK_URL");

    // Validate environment variables
    if (!clientID) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }
    if (!clientSecret) {
      throw new Error("GOOGLE_CLIENT_SECRET is not configured");
    }
    if (!callbackURL) {
      throw new Error("GOOGLE_CALLBACK_URL is not configured");
    }

    // Strategy initialized

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<any> {
    try {
      if (!profile || !profile.id) {
        return done(new Error("Invalid profile data from Google"), null);
      }

      const { id, name, emails, photos } = profile;

      if (!emails || !emails.length || !emails[0].value) {
        return done(new Error("No email found in Google profile"), null);
      }

      if (!name || (!name.givenName && !name.familyName)) {
        return done(new Error("No name found in Google profile"), null);
      }

      const user = {
        google_id: id,
        email: emails[0].value,
        full_name: `${name.givenName || ""} ${name.familyName || ""}`.trim(),
        avatar_url: photos && photos[0] ? photos[0].value : null,
        provider: "google",
        email_verified: true,
        accessToken,
        refreshToken,
      };

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
