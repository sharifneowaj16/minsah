/**
 * Elasticsearch Query Utilities
 * Provides sanitization, validation, and safety functions
 */

/**
 * Sanitize search query to prevent injection attacks
 */
export function sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[{}[\]]/g, '') // Remove brackets
    .slice(0, 200); // Max 200 characters
}

/**
 * Validate and normalize numeric parameters
 */
export function validateNumericParam(
  value: string | null,
  defaultValue: number,
  min: number,
  max: number
): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) return defaultValue;
  return num;
}

/**
 * Validate price range
 */
export function validatePriceRange(
  minPrice: string | null,
  maxPrice: string | null
): { min?: number; max?: number; valid: boolean } {
  const min = minPrice ? parseFloat(minPrice) : undefined;
  const max = maxPrice ? parseFloat(maxPrice) : undefined;

  // Validate ranges
  if (min !== undefined && (isNaN(min) || min < 0 || min > 1000000)) {
    return { valid: false };
  }

  if (max !== undefined && (isNaN(max) || max < 0 || max > 1000000)) {
    return { valid: false };
  }

  if (min !== undefined && max !== undefined && min > max) {
    return { valid: false };
  }

  return { min, max, valid: true };
}

/**
 * Validate rating parameter
 */
export function validateRating(rating: string | null): number | undefined {
  if (!rating) return undefined;
  const num = parseFloat(rating);
  if (isNaN(num) || num < 0 || num > 5) return undefined;
  return num;
}

/**
 * Build safe Elasticsearch query
 */
export function buildSafeQuery(rawQuery: string) {
  const sanitized = sanitizeQuery(rawQuery);
  
  if (!sanitized) {
    return { match_all: {} };
  }

  return {
    multi_match: {
      query: sanitized,
      fields: [
        'name^5',
        'brand^3',
        'category^2',
        'description^1.5',
        'tags^2',
      ],
      type: 'best_fields',
      fuzziness: 'AUTO',
      prefix_length: 2,
    }
  };
}

/**
 * Validate search parameters
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSearchParams(searchParams: URLSearchParams): ValidationResult {
  const errors: string[] = [];

  // Validate page
  const page = searchParams.get('page');
  if (page) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
      errors.push('Invalid page number (must be between 1-1000)');
    }
  }

  // Validate limit
  const limit = searchParams.get('limit');
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Invalid limit (must be between 1-100)');
    }
  }

  // Validate query length
  const query = searchParams.get('q');
  if (query && query.length > 200) {
    errors.push('Query too long (maximum 200 characters)');
  }

  // Validate price range
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const priceValidation = validatePriceRange(minPrice, maxPrice);
  if (!priceValidation.valid) {
    errors.push('Invalid price range');
  }

  // Validate rating
  const rating = searchParams.get('rating');
  if (rating && validateRating(rating) === undefined) {
    errors.push('Invalid rating (must be between 0-5)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
