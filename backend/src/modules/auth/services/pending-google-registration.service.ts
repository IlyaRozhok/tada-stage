import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

export interface GoogleUserData {
  google_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  email_verified: boolean;
}

export interface PendingGoogleRegistration {
  id: string;
  googleData: GoogleUserData;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class PendingGoogleRegistrationService {
  // In-memory storage for development
  // For production, use Redis or database
  private pendingRegistrations = new Map<string, PendingGoogleRegistration>();

  constructor() {
    // Clean up expired registrations every 5 minutes
    setInterval(
      () => {
        this.cleanupExpired();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Store Google user data temporarily (15 minutes)
   */
  storeGoogleData(googleData: GoogleUserData): string {
    const registrationId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

    const pending: PendingGoogleRegistration = {
      id: registrationId,
      googleData,
      expiresAt,
      createdAt: new Date(),
    };

    this.pendingRegistrations.set(registrationId, pending);

    console.log(
      `✅ Stored Google data for: ${googleData.email} (ID: ${registrationId})`
    );
    return registrationId;
  }

  /**
   * Retrieve and consume Google data (one-time use)
   */
  consumeGoogleData(registrationId: string): GoogleUserData | null {
    const pending = this.pendingRegistrations.get(registrationId);

    if (!pending) {
      console.log(`❌ Registration ID not found: ${registrationId}`);
      return null;
    }

    if (pending.expiresAt < new Date()) {
      console.log(`❌ Registration expired: ${registrationId}`);
      this.pendingRegistrations.delete(registrationId);
      return null;
    }

    // Remove from storage (consume)
    this.pendingRegistrations.delete(registrationId);
    console.log(`✅ Consumed Google data for: ${pending.googleData.email}`);

    return pending.googleData;
  }

  /**
   * Check if registration exists and is valid
   */
  isValidRegistration(registrationId: string): boolean {
    const pending = this.pendingRegistrations.get(registrationId);
    return pending !== undefined && pending.expiresAt > new Date();
  }

  /**
   * Clean up expired registrations
   */
  private cleanupExpired(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, pending] of this.pendingRegistrations.entries()) {
      if (pending.expiresAt < now) {
        this.pendingRegistrations.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired Google registrations`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalPending: this.pendingRegistrations.size,
      pendingEmails: Array.from(this.pendingRegistrations.values()).map(
        (p) => ({
          email: p.googleData.email,
          createdAt: p.createdAt,
          expiresAt: p.expiresAt,
        })
      ),
    };
  }
}
