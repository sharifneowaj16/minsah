import { Client } from '@elastic/elasticsearch';

// ========================================
// 🔹 ELASTICSEARCH CLIENT CONFIGURATION
// ========================================
export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  auth: {
    username: 'elastic',
    password: process.env.ELASTIC_PASSWORD || '',
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: false,
});

// ========================================
// 🔹 CONNECTION TEST
// ========================================
export async function testConnection(): Promise<boolean> {
  try {
    const health = await esClient.cluster.health();
    console.log('✅ Elasticsearch connected. Cluster status:', health.status);
    return true;
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error);
    return false;
  }
}

// ========================================
// 🔹 INDEX CONFIGURATION
// ========================================
export const PRODUCT_INDEX = 'products';

export const productIndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        autocomplete: {
          type: 'custom' as const,
          tokenizer: 'standard',
          filter: ['lowercase', 'autocomplete_filter']
        },
        autocomplete_search: {
          type: 'custom' as const,
          tokenizer: 'standard',
          filter: ['lowercase']
        },
        // ✅ Beauty search analyzer with synonym expansion
        beauty_search: {
          type: 'custom' as const,
          tokenizer: 'standard',
          filter: ['lowercase', 'beauty_synonym_filter']
        }
      },
      filter: {
        autocomplete_filter: {
          type: 'edge_ngram' as const,
          min_gram: 2,
          max_gram: 20
        },
        // ✅ Synonym filter for beauty product terms (70+ mappings)
        beauty_synonym_filter: {
          type: 'synonym' as const,
          synonyms: [
            // Skincare
            'moisturizer, lotion, face cream, skin cream, hydrating cream, day cream, night cream',
            'serum, essence, ampoule, booster',
            'cleanser, face wash, facial wash, cleansing foam, cleansing gel, makeup remover',
            'toner, astringent, skin toner, face toner, balancing toner',
            'sunscreen, sunblock, spf, sun protection, uv protection, sun cream',
            'exfoliator, scrub, face scrub, body scrub, peeling gel, exfoliant',
            'face mask, sheet mask, clay mask, peel off mask, sleeping mask, overnight mask',
            'eye cream, under eye cream, eye gel, anti-aging eye',
            'lip balm, lip care, lip treatment, lip butter, lip mask',
            'tinted moisturizer, bb cream, blemish balm, beauty balm, cc cream, color correcting cream',
            'retinol, vitamin a, anti-aging, anti wrinkle, wrinkle cream',
            'vitamin c, brightening, whitening, glow, luminous, radiant',
            'hyaluronic acid, hydration, moisture, hydrating',
            'niacinamide, pore minimizer, pore tightening',
            'aha, bha, glycolic acid, salicylic acid, chemical exfoliant',
            'collagen, firming, lifting, anti-sagging',
            // Makeup
            'foundation, base makeup, complexion base, liquid foundation, powder foundation',
            'lipstick, lip color, lip rouge, lip paint, lip tint, lip stain',
            'mascara, lash mascara, lash enhancer, volumizing mascara, lengthening mascara',
            'eyeliner, eye liner, kajal, kohl, liquid liner, pencil liner',
            'eyeshadow, eye shadow, eye color, eyeshadow palette',
            'blush, blusher, blush on, rouge, cheek color',
            'highlighter, illuminator, strobing stick, glow stick, shimmer',
            'concealer, cover stick, color corrector, spot corrector',
            'primer, makeup base, pore primer, face primer, eye primer',
            'setting spray, fixing spray, makeup spray, makeup fixer',
            'contour, bronzer, contouring, sculpting',
            'setting powder, loose powder, compact powder, pressed powder',
            'eyebrow, brow pencil, brow gel, brow powder, brow pomade',
            'lip liner, lip pencil',
            'lipgloss, lip gloss, lip shine, lip plumper',
            'blush palette, makeup palette, palette',
            // Haircare
            'shampoo, hair wash, hair cleanser, clarifying shampoo',
            'conditioner, hair conditioner, rinse, cream rinse',
            'hair mask, hair treatment, deep conditioner, deep conditioning mask',
            'hair oil, argan oil, hair serum, hair essence, hair elixir',
            'hair spray, hairspray, styling spray, finishing spray',
            'hair gel, styling gel, hair wax, hair pomade',
            'dry shampoo, volumizing shampoo',
            'heat protectant, heat protection, thermal protector',
            // Nails
            'nail polish, nail color, nail lacquer, nail varnish, nail enamel',
            'nail care, nail treatment, nail strengthener, nail hardener',
            'nail remover, nail polish remover, acetone',
            // Fragrance
            'perfume, fragrance, cologne, scent, eau de parfum, edp',
            'eau de toilette, edt, body spray, deodorant spray',
            'body mist, body spray, mist',
            // Body
            'body lotion, body cream, body moisturizer, body butter',
            'body wash, shower gel, bath gel, body cleanser',
            'bath bomb, bath salts, bath soak',
            'deodorant, antiperspirant, roll on',
            // Tools & Accessories
            'brush, makeup brush, blush brush, foundation brush',
            'sponge, beauty blender, makeup sponge',
            'tweezers, lash curler, eyelash curler',
          ]
        }
      }
    }
  },
  mappings: {
    properties: {
      id: { type: 'keyword' as const },
      name: {
        type: 'text' as const,
        analyzer: 'autocomplete',
        search_analyzer: 'beauty_search',
        fields: {
          keyword: { type: 'keyword' as const },
          suggest: {
            type: 'completion' as const,
            contexts: [
              {
                name: 'category',
                type: 'category' as const
              }
            ]
          }
        }
      },
      description: { type: 'text' as const, analyzer: 'beauty_search' },
      brand: {
        type: 'text' as const,
        fields: { keyword: { type: 'keyword' as const } }
      },
      category: { type: 'keyword' as const },
      subcategory: { type: 'keyword' as const },
      price: { type: 'float' as const },
      originalPrice: { type: 'float' as const },
      discount: { type: 'integer' as const },
      stock: { type: 'integer' as const },
      inStock: { type: 'boolean' as const },
      rating: { type: 'float' as const },
      reviewCount: { type: 'integer' as const },
      image: { type: 'keyword' as const },
      images: { type: 'keyword' as const },
      sku: { type: 'keyword' as const },
      tags: { type: 'keyword' as const },
      ingredients: { type: 'text' as const },
      isFeatured: { type: 'boolean' as const },
      isNewArrival: { type: 'boolean' as const },
      isFlashSale: { type: 'boolean' as const },
      isFavourite: { type: 'boolean' as const },
      isRecommended: { type: 'boolean' as const },
      isForYou: { type: 'boolean' as const },
      createdAt: { type: 'date' as const },
      updatedAt: { type: 'date' as const },
    }
  }
};

// ========================================
// 🔹 INDEX MANAGEMENT HELPERS
// ========================================

/**
 * Check if an index exists
 */
export async function indexExists(indexName: string): Promise<boolean> {
  try {
    return await esClient.indices.exists({ index: indexName });
  } catch (error) {
    console.error('❌ Error checking index existence:', error);
    return false;
  }
}

/**
 * Delete an index
 */
export async function deleteIndex(indexName: string): Promise<boolean> {
  try {
    await esClient.indices.delete({ index: indexName });
    console.log(`🗑️  Index ${indexName} deleted`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting index:', error);
    return false;
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats(indexName: string) {
  try {
    const stats = await esClient.indices.stats({ index: indexName });
    return stats;
  } catch (error) {
    console.error('❌ Error getting index stats:', error);
    return null;
  }
}

/**
 * Get document count in index
 */
export async function getDocumentCount(indexName: string): Promise<number> {
  try {
    const response = await esClient.count({ index: indexName });
    return response.count;
  } catch (error) {
    console.error('❌ Error counting documents:', error);
    return 0;
  }
}

/**
 * Refresh index to make changes immediately searchable
 */
export async function refreshIndex(indexName: string): Promise<boolean> {
  try {
    await esClient.indices.refresh({ index: indexName });
    return true;
  } catch (error) {
    console.error('❌ Error refreshing index:', error);
    return false;
  }
}
