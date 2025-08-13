// Simple in-memory cache for GitHub API responses
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class GitHubCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from URL and params
  static generateKey(url: string, params?: Record<string, any>): string {
    const sortedParams = params ? 
      Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') : 
      '';
    return `${url}${sortedParams ? '?' + sortedParams : ''}`;
  }
}

// Export the class
export { GitHubCache };

// Singleton instance
export const githubCache = new GitHubCache();