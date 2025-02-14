import { supabase } from '../config/database';
import { Order, OrderStatus, OrderProduct } from '../types';

export class OrderService {
  async createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_id: orderData.customer_id,
        total_amount: orderData.total_amount,
        status: orderData.status,
        payment_method: orderData.payment_method
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrder(id: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}