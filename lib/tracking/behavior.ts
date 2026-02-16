import type { CustomerSegment, RetargetingAudience, TrackingEvent } from '@/types/tracking';

/**
 * Customer Behavior Tracking & Segmentation System
 *
 * Tracks user behavior, creates customer segments, and builds retargeting audiences
 */

export interface CustomerBehavior {
  userId?: string;
  sessionId: string;
  deviceId: string;

  // Engagement metrics
  sessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  lastVisit: number;
  firstVisit: number;

  // Product interactions
  productsViewed: string[];
  categoriesViewed: string[];
  addToCartCount: number;
  wishlistCount: number;

  // Purchase behavior
  purchaseCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastPurchaseDate?: number;

  // Content engagement
  blogPostsRead: string[];
  searchQueries: string[];

  // Lifecycle stage
  stage: 'visitor' | 'lead' | 'customer' | 'loyal_customer' | 'churned';

  // Risk scores
  churnRisk: number; // 0-100
  conversionProbability: number; // 0-100
}

export class BehaviorTracker {
  private static STORAGE_KEY = 'customer_behavior';
  // Debounce timer for background DB sync (non-critical events)
  private static syncTimer: ReturnType<typeof setTimeout> | null = null;
  private static SYNC_DELAY_MS = 5000;

  /**
   * Get current customer behavior data
   */
  static getBehavior(): CustomerBehavior | null {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Initialize behavior tracking for new visitor
   */
  static initBehavior(sessionId: string, deviceId: string): CustomerBehavior {
    const now = Date.now();
    const behavior: CustomerBehavior = {
      sessionId,
      deviceId,
      sessions: 1,
      totalPageViews: 0,
      avgSessionDuration: 0,
      lastVisit: now,
      firstVisit: now,
      productsViewed: [],
      categoriesViewed: [],
      addToCartCount: 0,
      wishlistCount: 0,
      purchaseCount: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      blogPostsRead: [],
      searchQueries: [],
      stage: 'visitor',
      churnRisk: 0,
      conversionProbability: 20, // Default probability
    };

    this.saveBehavior(behavior);
    return behavior;
  }

  /**
   * Update behavior based on event
   */
  static trackEvent(event: TrackingEvent, data?: any): void {
    let behavior = this.getBehavior();
    if (!behavior) return;

    const now = Date.now();
    behavior.lastVisit = now;

    switch (event) {
      case 'PageView':
        behavior.totalPageViews++;
        break;

      case 'ViewContent':
        if (data?.product_id && !behavior.productsViewed.includes(data.product_id)) {
          behavior.productsViewed.push(data.product_id);
          behavior.conversionProbability = Math.min(100, behavior.conversionProbability + 5);
        }
        if (data?.category && !behavior.categoriesViewed.includes(data.category)) {
          behavior.categoriesViewed.push(data.category);
        }
        break;

      case 'AddToCart':
        behavior.addToCartCount++;
        behavior.conversionProbability = Math.min(100, behavior.conversionProbability + 15);
        break;

      case 'AddToWishlist':
        behavior.wishlistCount++;
        behavior.conversionProbability = Math.min(100, behavior.conversionProbability + 10);
        break;

      case 'InitiateCheckout':
        behavior.conversionProbability = Math.min(100, behavior.conversionProbability + 25);
        break;

      case 'Purchase':
        behavior.purchaseCount++;
        behavior.totalRevenue += data?.value || 0;
        behavior.avgOrderValue = behavior.totalRevenue / behavior.purchaseCount;
        behavior.lastPurchaseDate = now;
        behavior.stage = behavior.purchaseCount >= 3 ? 'loyal_customer' : 'customer';
        behavior.churnRisk = 0; // Reset churn risk on purchase
        behavior.conversionProbability = 80; // High probability for repeat purchase
        break;

      case 'Search':
        if (data?.search_term && !behavior.searchQueries.includes(data.search_term)) {
          behavior.searchQueries.push(data.search_term);
        }
        break;

      case 'CompleteRegistration':
        behavior.stage = 'lead';
        behavior.conversionProbability = Math.min(100, behavior.conversionProbability + 20);
        if (data?.user_id) {
          behavior.userId = data.user_id;
        }
        break;
    }

    // Update lifecycle stage
    if (behavior.stage === 'visitor' && behavior.totalPageViews > 5) {
      behavior.stage = 'lead';
    }

    // Calculate churn risk
    if (behavior.lastPurchaseDate) {
      const daysSinceLastPurchase = (now - behavior.lastPurchaseDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPurchase > 90) {
        behavior.churnRisk = Math.min(100, (daysSinceLastPurchase - 90) * 2);
        behavior.stage = 'churned';
      } else if (daysSinceLastPurchase > 60) {
        behavior.churnRisk = Math.min(100, (daysSinceLastPurchase - 60) * 1.5);
      }
    }

    // Sync immediately to DB for high-value events, otherwise debounce
    const criticalEvent = event === 'Purchase' || event === 'CompleteRegistration';
    this.saveBehavior(behavior, criticalEvent);
  }

  /**
   * Save behavior to localStorage + trigger debounced DB sync
   */
  private static saveBehavior(behavior: CustomerBehavior, immediate = false): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(behavior));

    if (immediate) {
      // Fire-and-forget for critical events (Purchase, Registration)
      this.syncToDB(behavior);
    } else {
      // Debounced sync for frequent events (PageView, AddToCart, etc.)
      if (this.syncTimer) clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => {
        this.syncToDB(behavior);
      }, this.SYNC_DELAY_MS);
    }
  }

  /**
   * Persist behavior data to database (async, fire-and-forget)
   */
  static async syncToDB(behavior?: CustomerBehavior): Promise<void> {
    if (typeof window === 'undefined') return;
    const data = behavior ?? this.getBehavior();
    if (!data?.deviceId) return;

    try {
      await fetch('/api/behavior', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId: data.deviceId, data }),
      });
    } catch {
      // Silently fail — localStorage still has the data
    }
  }

  /**
   * Load behavior from DB and merge into localStorage
   * Call this on user login or page init
   */
  static async loadFromDB(deviceId: string): Promise<CustomerBehavior | null> {
    if (typeof window === 'undefined') return null;

    try {
      const res = await fetch(`/api/behavior?deviceId=${encodeURIComponent(deviceId)}`, {
        credentials: 'include',
      });
      if (!res.ok) return null;

      const { behavior: dbData } = await res.json();
      if (!dbData) return null;

      const dbBehavior = dbData as CustomerBehavior;
      const localBehavior = this.getBehavior();

      // Merge: take higher values from each source
      if (localBehavior) {
        const merged: CustomerBehavior = {
          ...dbBehavior,
          sessions: Math.max(dbBehavior.sessions, localBehavior.sessions),
          totalPageViews: Math.max(dbBehavior.totalPageViews, localBehavior.totalPageViews),
          addToCartCount: Math.max(dbBehavior.addToCartCount, localBehavior.addToCartCount),
          wishlistCount: Math.max(dbBehavior.wishlistCount, localBehavior.wishlistCount),
          purchaseCount: Math.max(dbBehavior.purchaseCount, localBehavior.purchaseCount),
          totalRevenue: Math.max(dbBehavior.totalRevenue, localBehavior.totalRevenue),
          productsViewed: [...new Set([...dbBehavior.productsViewed, ...localBehavior.productsViewed])],
          categoriesViewed: [...new Set([...dbBehavior.categoriesViewed, ...localBehavior.categoriesViewed])],
          blogPostsRead: [...new Set([...dbBehavior.blogPostsRead, ...localBehavior.blogPostsRead])],
          searchQueries: [...new Set([...dbBehavior.searchQueries, ...localBehavior.searchQueries])],
          firstVisit: Math.min(dbBehavior.firstVisit, localBehavior.firstVisit),
          lastVisit: Math.max(dbBehavior.lastVisit, localBehavior.lastVisit),
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dbBehavior));
      return dbBehavior;
    } catch {
      return null;
    }
  }

  /**
   * Get customer segment based on behavior
   */
  static getSegment(): CustomerSegment | null {
    const behavior = this.getBehavior();
    if (!behavior) return null;

    // Determine segment based on behavior
    let segment: NonNullable<CustomerSegment['segment']>;
    let value: 'high' | 'medium' | 'low';

    if (behavior.stage === 'loyal_customer') {
      segment = 'loyal';
      value = 'high';
    } else if (behavior.stage === 'customer') {
      segment = behavior.purchaseCount === 1 ? 'first_time' : 'returning';
      value = behavior.avgOrderValue > 100 ? 'high' : 'medium';
    } else if (behavior.stage === 'churned') {
      segment = 'at_risk';
      value = behavior.totalRevenue > 200 ? 'high' : 'medium';
    } else if (behavior.addToCartCount > 0 || behavior.wishlistCount > 0) {
      segment = 'engaged';
      value = behavior.conversionProbability > 50 ? 'medium' : 'low';
    } else if (behavior.totalPageViews > 10) {
      segment = 'browsers';
      value = 'low';
    } else {
      segment = 'visitors';
      value = 'low';
    }

    return {
      id: `seg_${behavior.deviceId}`,
      name: this.getSegmentName(segment),
      segment,
      criteria: {
        minPageViews: behavior.totalPageViews,
        minPurchases: behavior.purchaseCount,
        minRevenue: behavior.totalRevenue,
      },
      userCount: 1,
      value,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get human-readable segment name
   */
  private static getSegmentName(segment: NonNullable<CustomerSegment['segment']>): string {
    const names: Record<NonNullable<CustomerSegment['segment']>, string> = {
      visitors: 'New Visitors',
      browsers: 'Active Browsers',
      engaged: 'Engaged Shoppers',
      cart_abandoners: 'Cart Abandoners',
      first_time: 'First-Time Customers',
      returning: 'Returning Customers',
      loyal: 'Loyal Customers',
      at_risk: 'At-Risk Customers',
      high_value: 'High-Value Customers',
    };
    return names[segment];
  }

  /**
   * Get retargeting audiences
   */
  static getRetargetingAudiences(): RetargetingAudience[] {
    const behavior = this.getBehavior();
    if (!behavior) return [];

    const audiences: RetargetingAudience[] = [];
    const now = Date.now();

    // Cart abandoners (added to cart but didn't purchase in last 7 days)
    if (behavior.addToCartCount > 0 && behavior.purchaseCount === 0) {
      const daysSinceCart = (now - behavior.lastVisit) / (1000 * 60 * 60 * 24);
      if (daysSinceCart <= 7) {
        audiences.push({
          id: 'cart_abandoners',
          name: 'Cart Abandoners',
          platform: 'all',
          criteria: {
            events: ['AddToCart'],
            excludeEvents: ['Purchase'],
            timeWindow: 7,
          },
          size: 1,
          createdAt: behavior.firstVisit,
          status: 'active',
        });
      }
    }

    // Product viewers (viewed products but didn't add to cart)
    if (behavior.productsViewed.length > 0 && behavior.addToCartCount === 0) {
      audiences.push({
        id: 'product_viewers',
        name: 'Product Viewers - No Cart',
        platform: 'all',
        criteria: {
          events: ['ViewContent'],
          excludeEvents: ['AddToCart'],
          timeWindow: 14,
        },
        size: 1,
        createdAt: behavior.firstVisit,
        status: 'active',
      });
    }

    // Past purchasers (purchased in last 90 days)
    if (behavior.purchaseCount > 0 && behavior.lastPurchaseDate) {
      const daysSincePurchase = (now - behavior.lastPurchaseDate) / (1000 * 60 * 60 * 24);
      if (daysSincePurchase <= 90) {
        audiences.push({
          id: 'past_purchasers',
          name: 'Past Purchasers',
          platform: 'all',
          criteria: {
            events: ['Purchase'],
            timeWindow: 90,
          },
          size: 1,
          createdAt: behavior.firstVisit,
          status: 'active',
        });
      }
    }

    // High intent (multiple visits, high page views, searches)
    if (behavior.sessions >= 3 && behavior.totalPageViews >= 10) {
      audiences.push({
        id: 'high_intent',
        name: 'High Intent Shoppers',
        platform: 'all',
        criteria: {
          minSessions: 3,
          minPageViews: 10,
          timeWindow: 30,
        },
        size: 1,
        createdAt: behavior.firstVisit,
        status: 'active',
      });
    }

    // Churned customers (last purchase > 90 days ago)
    if (behavior.churnRisk > 50) {
      audiences.push({
        id: 'win_back',
        name: 'Win-Back Customers',
        platform: 'all',
        criteria: {
          events: ['Purchase'],
          daysSinceEvent: 90,
        },
        size: 1,
        createdAt: behavior.firstVisit,
        status: 'active',
      });
    }

    return audiences;
  }

  /**
   * Get customer lifetime value (CLV) prediction
   */
  static predictCLV(): number {
    const behavior = this.getBehavior();
    if (!behavior) return 0;

    // Simple CLV calculation based on current behavior
    const avgPurchaseFrequency = behavior.purchaseCount / Math.max(1, behavior.sessions);
    const estimatedLifetimeValue = behavior.avgOrderValue * avgPurchaseFrequency * 12; // 1 year projection

    return Math.round(estimatedLifetimeValue * 100) / 100;
  }

  /**
   * Clear behavior data from localStorage (and optionally DB)
   */
  static clearBehavior(): void {
    if (typeof window === 'undefined') return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
