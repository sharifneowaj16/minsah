import { NextResponse } from 'next/server';
import { searchMetrics } from '@/lib/elasticsearch/metrics';

/**
 * GET /api/search/metrics
 * Returns search performance metrics and statistics
 * Protected endpoint - should add auth in production
 */
export async function GET() {
  try {
    const stats = searchMetrics.getStats();
    const recentSearches = searchMetrics.getRecent(20);
    const slowQueries = searchMetrics.getSlowQueries();
    const noResultQueries = searchMetrics.getNoResultQueries();

    return NextResponse.json({
      success: true,
      metrics: {
        overview: stats,
        recentSearches: recentSearches.map(m => ({
          query: m.query,
          duration: m.duration,
          resultCount: m.resultCount,
          success: m.success,
          timestamp: m.timestamp,
        })),
        slowQueries: slowQueries.slice(0, 10).map(m => ({
          query: m.query,
          duration: m.duration,
          resultCount: m.resultCount,
          timestamp: m.timestamp,
        })),
        noResultQueries: noResultQueries.slice(0, 10).map(m => ({
          query: m.query,
          filters: m.filters,
          timestamp: m.timestamp,
        })),
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
