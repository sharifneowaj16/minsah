import { esClient, PRODUCT_INDEX, productIndexMapping, indexExists } from '@/lib/elasticsearch';
import prisma from '@/lib/prisma';

// ✅ Type definitions for indexing
interface BulkIndexOperation {
  index: {
    _index: string;
    _id: string;
  };
}

interface ProductIndexDocument {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  images?: string[];
  inStock: boolean;
  rating?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Create product index if not exists
export async function createProductIndex() {
  try {
    const exists = await indexExists(PRODUCT_INDEX);
    
    if (exists) {
      console.log(`✅ Index ${PRODUCT_INDEX} already exists`);
      return true;
    }

    await esClient.indices.create({
  index: PRODUCT_INDEX,
  settings: productIndexMapping.settings,
  mappings: productIndexMapping.mappings,
});
    
    console.log(`✅ Index ${PRODUCT_INDEX} created successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error creating index:', error);
    return false;
  }
}

// Transform product for Elasticsearch
async function transformProductForES(product: any) {
  let categoryName = '';
  let subcategoryName = '';

  // Fetch category hierarchy if product has categoryId
  if (product.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: product.categoryId },
      include: {
        parent: {
          include: {
            parent: true // For 3-level hierarchy
          }
        }
      }
    });

    if (category) {
      if (category.parent?.parent) {
        // This is an item (3rd level)
        subcategoryName = category.parent.name;
        categoryName = category.parent.parent.name;
      } else if (category.parent) {
        // This is a subcategory (2nd level)
        subcategoryName = category.name;
        categoryName = category.parent.name;
      } else {
        // This is a top-level category (1st level)
        categoryName = category.name;
      }
    }
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    brand: product.brand?.name || '',
    category: categoryName,
    subcategory: subcategoryName,
    price: parseFloat(product.price?.toString() || '0'),
    originalPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
    discount: product.compareAtPrice
      ? Math.round(((parseFloat(product.compareAtPrice.toString()) - parseFloat(product.price.toString())) / parseFloat(product.compareAtPrice.toString())) * 100)
      : 0,
    stock: product.quantity || 0,
    inStock: (product.quantity || 0) > 0,
    rating: 0, // Calculate from reviews if needed
    reviewCount: 0,
    image: product.images?.[0]?.url || '',
    images: product.images?.map((img: any) => img.url) || [],
    sku: product.sku || '',
    tags: [], // Add if you have tags
    ingredients: '', // Add if you have ingredients
    isFeatured: product.isFeatured || false,
    isNewArrival: product.isNew || false,
    isFlashSale: false,
    isFavourite: false,
    isRecommended: false,
    isForYou: false,
    createdAt: product.createdAt || new Date(),
    updatedAt: product.updatedAt || new Date(),
  };
}

// Index a single product
export async function indexProduct(product: any) {
  try {
    const transformedProduct = await transformProductForES(product);
    
    await esClient.index({
      index: PRODUCT_INDEX,
      id: product.id,
      document: transformedProduct,
    });
    
    // Refresh to make changes immediately searchable
    await esClient.indices.refresh({ index: PRODUCT_INDEX });
    
    console.log(`✅ Product ${product.id} indexed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error indexing product ${product.id}:`, error);
    return false;
  }
}

// Update a product in the index
export async function updateProduct(productId: string, updates: any) {
  try {
    await esClient.update({
      index: PRODUCT_INDEX,
      id: productId,
      doc: updates,
    });
    
    await esClient.indices.refresh({ index: PRODUCT_INDEX });
    
    console.log(`✅ Product ${productId} updated successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating product ${productId}:`, error);
    return false;
  }
}

// Delete a product from index
export async function deleteProduct(productId: string) {
  try {
    await esClient.delete({
      index: PRODUCT_INDEX,
      id: productId,
    });
    
    console.log(`✅ Product ${productId} deleted from index`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting product ${productId}:`, error);
    return false;
  }
}

// Bulk index all products from database
export async function indexAllProducts() {
  try {
    console.log('📊 Fetching products from database...');
    
    // Get all visible products from Prisma
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        images: true,
        category: {
          include: {
            parent: {
              include: {
                parent: true
              }
            }
          }
        }
      },
    });

    if (products.length === 0) {
      console.log('⚠️ No products found to index');
      return true;
    }

    console.log(`📦 Found ${products.length} products to index`);

    // Prepare bulk operations
    const operationPairs = await Promise.all(
      products.map(async product => {
        const transformedProduct = await transformProductForES(product);
        return [
          { index: { _index: PRODUCT_INDEX, _id: product.id } },
          transformedProduct,
        ];
      })
    );
    const operations = operationPairs.flat();

    // Execute bulk indexing
    const response = await esClient.bulk({ 
      operations,
      refresh: true 
    });
    
    if (response.errors) {
      const erroredDocuments = response.items.filter((item: any) => item.index?.error);
      console.error('❌ Bulk indexing had errors:', erroredDocuments);
      return false;
    }

    console.log(`✅ Successfully indexed ${products.length} products`);
    
    // Get index stats
    const stats = await esClient.count({ index: PRODUCT_INDEX });
    console.log(`📊 Total documents in index: ${stats.count}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error bulk indexing products:', error);
    return false;
  }
}

// Reindex all products (delete and recreate)
export async function reindexAllProducts() {
  try {
    console.log('🔄 Starting reindex process...');
    
    // Check if index exists
    const exists = await indexExists(PRODUCT_INDEX);
    
    if (exists) {
      console.log('🗑️ Deleting existing index...');
      await esClient.indices.delete({ index: PRODUCT_INDEX });
    }
    
    // Create fresh index
    console.log('📦 Creating new index...');
    await createProductIndex();
    
    // Index all products
    console.log('📊 Indexing products...');
    await indexAllProducts();
    
    console.log('✅ Reindex completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error reindexing products:', error);
    return false;
  }
}

// Search products (basic wrapper)
export async function searchProducts(query: string, options: any = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort = 'relevance'
    } = options;

    const must: any[] = [];
    const filter: any[] = [];

    // Build search query
    if (query) {
      must.push({
        multi_match: {
          query: query,
          fields: [
            'name^3',
            'brand^2',
            'description',
            'category',
            'tags',
            'ingredients'
          ],
          fuzziness: 'AUTO',
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    // Apply filters
    if (category) {
      filter.push({ term: { category } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const range: any = {};
      if (minPrice !== undefined) range.gte = minPrice;
      if (maxPrice !== undefined) range.lte = maxPrice;
      filter.push({ range: { price: range } });
    }

    if (inStock) {
      filter.push({ term: { inStock: true } });
    }

    // Determine sort order
    let sortOrder: any[] = [{ _score: 'desc' }];
    
    if (sort === 'price_asc') {
      sortOrder = [{ price: 'asc' }];
    } else if (sort === 'price_desc') {
      sortOrder = [{ price: 'desc' }];
    } else if (sort === 'newest') {
      sortOrder = [{ createdAt: 'desc' }];
    } else if (sort === 'rating') {
      sortOrder = [{ rating: 'desc' }];
    }

    const response = await esClient.search({
      index: PRODUCT_INDEX,
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: {
          must,
          filter,
        }
      },
      sort: sortOrder,
      highlight: {
        fields: {
          name: {},
          description: {},
        }
      }
    });

    const hits = response.hits.hits;
    const products = hits.map((hit: any) => ({
      ...hit._source,
      _score: hit._score,
      _highlights: hit.highlight,
    }));

    const total = typeof response.hits.total === 'object'
      ? (response.hits.total?.value ?? 0)
      : (response.hits.total ?? 0);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('❌ Search error:', error);
    throw error;
  }
}
