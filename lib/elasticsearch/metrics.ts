/**
 * Search Metrics Collector
 * Tracks search performance and statistics
 */

export interface SearchMetric {
  query: string;
  duration: number;
  resultCount: number;
  filters: string[];
  timestamp: Date;
  success: boolean;
  error?: string;
}

class SearchMetricsCollector {
  private metrics: SearchMetric[] = [];
  private readonly maxSize = 1000; // Keep last 1000 searches
  private readonly slowQueryThreshold = 1000; // 1 second

  /**
   * Add a search metric
   */
  add(metric: SearchMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }

  /**
   * Get average search duration
   */
  getAverageDuration(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.duration, 0);
    return Math.round(sum / this.metrics.length);
  }

  /**
   * Get slow queries (> threshold)
   */
  getSlowQueries(threshold: number = this.slowQueryThreshold): SearchMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successful = this.metrics.filter(m => m.success).length;
    return Math.round((successful / this.metrics.length) * 100);
  }

  /**
   * Get popular search queries
   */
  getPopularQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const queryMap = new Map<string, number>();
    
    this.metrics.forEach(m => {
      const query = m.query.toLowerCase().trim();
      if (query) {
        queryMap.set(query, (queryMap.get(query) || 0) + 1);
      }
    });

    return Array.from(queryMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get searches with no results
   */
  getNoResultQueries(): SearchMetric[] {
    return this.metrics.filter(m => m.success && m.resultCount === 0);
  }

  /**
   * Get comprehensive stats
   */
  getStats() {
    const slowQueries = this.getSlowQueries();
    const noResults = this.getNoResultQueries();

    return {
      totalSearches: this.metrics.length,
      avgDuration: this.getAverageDuration(),
      successRate: this.getSuccessRate(),
      slowQueries: {
        count: slowQueries.length,
        percentage: this.metrics.length > 0 
          ? Math.round((slowQueries.length / this.metrics.length) * 100)
          : 0,
      },
      noResultQueries: {
        count: noResults.length,
        percentage: this.metrics.length > 0
          ? Math.round((noResults.length / this.metrics.length) * 100)
          : 0,
      },
      popularQueries: this.getPopularQueries(5),
    };
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get recent metrics
   */
  getRecent(count: number = 10): SearchMetric[] {
    return this.metrics.slice(-count);
  }
}

// Export singleton instance
export const searchMetrics = new SearchMetricsCollector();
