import { Injectable } from "@nestjs/common";
import { Property } from "../../../entities/property.entity";
import { EnhancedMatchingResult } from "../matching-enhanced.service";

@Injectable()
export class MatchingCacheService {
  private cache = new Map<
    string,
    {
      data: Property[] | EnhancedMatchingResult[];
      timestamp: number;
      ttl: number;
    }
  >();

  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data for a key
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data: data as any,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache key for user matches
   */
  getUserMatchesKey(userId: string, limit?: number): string {
    return `user_matches:${userId}:${limit || 20}`;
  }

  /**
   * Get cache key for perfect matches
   */
  getPerfectMatchesKey(userId: string): string {
    return `perfect_matches:${userId}`;
  }

  /**
   * Get cache key for high-score matches
   */
  getHighScoreMatchesKey(
    userId: string,
    threshold: number,
    limit: number
  ): string {
    return `high_score_matches:${userId}:${threshold}:${limit}`;
  }

  /**
   * Invalidate all caches for a user
   */
  invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(`:${userId}:`) || key.endsWith(`:${userId}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalidate all caches for a property
   */
  invalidatePropertyCache(propertyId: string): void {
    // Since property changes affect all users, we clear all caches
    // In a more sophisticated implementation, we could track which users
    // are affected by specific properties
    this.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(value).length * 2;
    }

    return totalSize;
  }
}
