import { supabase } from '../config/database';
import { Customer, CustomerStats, CustomerFilters } from '../types';
import { DatabaseError } from '../utils/errors';



export class CustomerService {
  async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    try {
      // Vérifier si le client existe déjà
      const existing = await this.findDuplicateCustomer(customer);
      if (existing) {
        throw new DatabaseError('Customer already exists', 'DUPLICATE_CUSTOMER');
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          phone_number: this.formatPhoneNumber(customer.phone_number),
          name: customer.name?.trim(),
          whatsapp_id: customer.whatsapp_id
        }])
        .select()
        .single();

      if (error) throw new DatabaseError(error.message, error.code);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create customer', 'CREATE_FAILED');
    }
  }

  async getCustomerByWhatsApp(whatsappId: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders:orders(count),
          total_spent:orders(sum(total_amount))
        `)
        .eq('whatsapp_id', whatsappId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No results found
        throw new DatabaseError(error.message, error.code);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get customer', 'GET_FAILED');
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      if (updates.phone_number) {
        updates.phone_number = this.formatPhoneNumber(updates.phone_number);
      }

      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new DatabaseError(error.message, error.code);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update customer', 'UPDATE_FAILED');
    }
  }

  async searchCustomers(filters: CustomerFilters): Promise<{ customers: Customer[], total: number }> {
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Appliquer les filtres de recherche
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
      }

      // Appliquer le tri
      if (filters.sortBy) {
        query = query.order(filters.sortBy, {
          ascending: filters.sortOrder === 'asc'
        });
      }

      // Appliquer la pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw new DatabaseError(error.message, error.code);
      return {
        customers: data,
        total: count || 0
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to search customers', 'SEARCH_FAILED');
    }
  }

  async getCustomerStats(customerId: string): Promise<CustomerStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_customer_stats', { customer_id: customerId });

      if (error) throw new DatabaseError(error.message, error.code);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get customer stats', 'STATS_FAILED');
    }
  }

  private async findDuplicateCustomer(customer: Partial<Customer>): Promise<Customer | null> {
    const { data } = await supabase
      .from('customers')
      .select()
      .or(`phone_number.eq.${this.formatPhoneNumber(customer.phone_number!)},whatsapp_id.eq.${customer.whatsapp_id}`)
      .single();

    return data;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Supprimer tous les caractères non numériques
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Si le numéro commence par '00', le remplacer par '+'
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2);
    }
    // Si le numéro commence par '0', ajouter l'indicatif du pays
    else if (cleaned.startsWith('0')) {
      cleaned = '+221' + cleaned.slice(1); // Pour le Sénégal
    }
    // Si le numéro ne commence pas par '+', ajouter '+'
    else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Vérifier que le numéro est valide
    const phoneRegex = /^\+(?:221|225|223|226|227|228|229|233|234)[1-9]\d{8}$/;
    if (!phoneRegex.test(cleaned)) {
      throw new Error('Invalid phone number format');
    }

    return cleaned;
  }
}