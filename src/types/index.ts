// Types de base pour l'application
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    embedding?: number[];
    category: string;
    stock: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface ProductCreate {
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    stock: number;
  }
  
  export interface Order {
    id: string;
    customer_id: string;
    total_amount: number;
    status: OrderStatus;
    payment_method: PaymentMethod;
    created_at: string;
    products: OrderProduct[];
  }
  
  export interface OrderProduct {
    product_id: string;
    quantity: number;
    price: number;
  }
  
  export interface Customer {
    id: string;
    phone_number: string;
    name?: string;
    whatsapp_id: string;
    created_at: string;
  }


  export interface PaymentResponse {
    status: 'pending' | 'success' | 'failed';
    reference: string;
    amount: number;
    phoneNumber: string;
    provider: PaymentMethod;
    transactionId?: string;
    message?: string;
    timestamp: string;
  }
  
  export interface PaymentProvider {
    name: PaymentMethod;
    baseUrl: string;
    apiKey: string;
    merchantId: string;
  }
  
  export interface CustomerFilters {
    search?: string;
    sortBy?: 'created_at' | 'name' | 'phone_number';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
  
  export interface CustomerStats {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string | null;
    averageOrderValue: number;
  }

  export interface Vendor {
    id: string;
    login: string;
    name: string;
    phoneNumber: string;
    createdAt: string;
    status: 'active' | 'inactive';
    lastConnection: string;
  }
  
  export interface VendorSession {
    vendorId: string;
    deviceId: string;
    startTime: string;
    isActive: boolean;
    authFolder: string;
  }

  export type OrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled';
  export type PaymentMethod = 'orange_money' | 'wave' | 'mtn' | 'other';