import { supabase } from '../config/database';
import { Product, ProductCreate } from '../types';  // Modifié ici
import { OpenAIService } from './openai.service';
import { CONFIG } from '../config/constants';

export class ProductService {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  async createProduct(product: ProductCreate): Promise<Product> {
    const embedding = await this.openAIService.generateEmbedding(
      `${product.name} ${product.description}`
    );

    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, embedding }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const queryEmbedding = await this.openAIService.generateEmbedding(query);

    const { data, error } = await supabase
      .rpc('match_products', {
        query_embedding: queryEmbedding,
        match_threshold: CONFIG.SIMILARITY_THRESHOLD,
        match_count: CONFIG.MAX_PRODUCTS_PER_RESPONSE
      });

    if (error) throw error;
    return data;
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProduct(id: string, updates: Partial<ProductCreate>): Promise<Product> {
    let embedding;
    if (updates.name || updates.description) {
      const product = await this.getProduct(id);
      embedding = await this.openAIService.generateEmbedding(
        `${updates.name || product.name} ${updates.description || product.description}`
      );
    }

    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, ...(embedding && { embedding }) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}