import axios from 'axios';
import { PaymentMethod, PaymentResponse, PaymentProvider } from '../types';
import { CONFIG } from '../config/constants';


export class PaymentService {
  private providers: Map<PaymentMethod, PaymentProvider>;

  constructor() {
    this.providers = new Map([
      ['orange_money', {
        name: 'orange_money',
        baseUrl: process.env.ORANGE_MONEY_API_URL || '',
        apiKey: process.env.ORANGE_MONEY_API_KEY || '',
        merchantId: process.env.ORANGE_MONEY_MERCHANT_ID || ''
      }],
      ['wave', {
        name: 'wave',
        baseUrl: process.env.WAVE_API_URL || '',
        apiKey: process.env.WAVE_API_KEY || '',
        merchantId: process.env.WAVE_MERCHANT_ID || ''
      }],
      ['mtn', {
        name: 'mtn',
        baseUrl: process.env.MTN_API_URL || '',
        apiKey: process.env.MTN_API_KEY || '',
        merchantId: process.env.MTN_MERCHANT_ID || ''
      }],
      ['other', {
        name: 'other',
        baseUrl: '',
        apiKey: '',
        merchantId: ''
      }]
    ]);
  }

  async initiatePayment(amount: number, method: PaymentMethod, phoneNumber: string): Promise<PaymentResponse> {
    try {
      this.validatePaymentDetails(amount, method, phoneNumber);
      
      const provider = this.providers.get(method);
      if (!provider) {
        throw new Error(`Payment provider ${method} not configured`);
      }

      switch (method) {
        case 'orange_money':
          return await this.processOrangeMoneyPayment(amount, phoneNumber, provider);
        case 'wave':
          return await this.processWavePayment(amount, phoneNumber, provider);
        case 'mtn':
          return await this.processMTNPayment(amount, phoneNumber, provider);
        case 'other':
          return await this.processOtherPayment(amount, phoneNumber);
        default:
          throw new Error('Payment method not supported');
      }
    } catch (error) {
      console.error(`Payment initiation failed: ${(error as Error).message}`);
      return {
        status: 'failed',
        reference: `ERROR${Date.now()}`,
        amount,
        phoneNumber,
        provider: method,
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkPaymentStatus(reference: string, method: PaymentMethod): Promise<PaymentResponse> {
    try {
      const provider = this.providers.get(method);
      if (!provider) {
        throw new Error(`Payment provider ${method} not configured`);
      }

      if (method === 'other') {
        return {
          status: 'pending',
          reference,
          amount: 0,
          phoneNumber: '',
          provider: method,
          timestamp: new Date().toISOString()
        };
      }

      const response = await axios.get(
        `${provider.baseUrl}/transactions/${reference}`,
        this.getRequestConfig(provider)
      );

      return {
        status: this.mapProviderStatus(response.data.status, method),
        reference,
        amount: response.data.amount,
        phoneNumber: response.data.phoneNumber,
        provider: method,
        transactionId: response.data.transactionId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Payment status check failed: ${(error as Error).message}`);
      throw new Error(`Failed to check payment status: ${(error as Error).message}`);
    }
  }

  private validatePaymentDetails(amount: number, method: PaymentMethod, phoneNumber: string): void {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    if (!this.providers.has(method)) {
      throw new Error('Unsupported payment method');
    }
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Regex pour les numéros de téléphone d'Afrique de l'Ouest
    const phoneRegex = /^(?:\+(?:221|225|223|226|227|228|229|233|234)|0)[1-9]\d{8}$/;
    return phoneRegex.test(phoneNumber);
  }

  private async processOrangeMoneyPayment(
    amount: number,
    phoneNumber: string,
    provider: PaymentProvider
  ): Promise<PaymentResponse> {
    const payload = {
      amount,
      phoneNumber: this.formatPhoneNumber(phoneNumber, 'orange'),
      merchantId: provider.merchantId,
      reference: `OM${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      //callbackUrl: `${CONFIG.BASE_URL}/api/payments/callback/orange`
    };

    const response = await axios.post(
      `${provider.baseUrl}/payments`,
      payload,
      this.getRequestConfig(provider)
    );

    return {
      status: 'pending',
      reference: payload.reference,
      amount,
      phoneNumber,
      provider: 'orange_money',
      transactionId: response.data.transactionId,
      timestamp: new Date().toISOString()
    };
  }

  private async processWavePayment(
    amount: number,
    phoneNumber: string,
    provider: PaymentProvider
  ): Promise<PaymentResponse> {
    // Implémentation similaire pour Wave
    return {
      status: 'pending',
      reference: `WV${Date.now()}`,
      amount,
      phoneNumber,
      provider: 'wave',
      timestamp: new Date().toISOString()
    };
  }

  private async processMTNPayment(
    amount: number,
    phoneNumber: string,
    provider: PaymentProvider
  ): Promise<PaymentResponse> {
    // Implémentation similaire pour MTN
    return {
      status: 'pending',
      reference: `MTN${Date.now()}`,
      amount,
      phoneNumber,
      provider: 'mtn',
      timestamp: new Date().toISOString()
    };
  }

  private async processOtherPayment(
    amount: number,
    phoneNumber: string
  ): Promise<PaymentResponse> {
    return {
      status: 'pending',
      reference: `OTHER${Date.now()}`,
      amount,
      phoneNumber,
      provider: 'other',
      timestamp: new Date().toISOString()
    };
  }

  private getRequestConfig(provider: PaymentProvider) {
    return {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'X-Merchant-Id': provider.merchantId
      }
    };
  }

  private mapProviderStatus(providerStatus: string, method: PaymentMethod): 'pending' | 'success' | 'failed' {
    const statusMaps: Record<PaymentMethod, Record<string, 'pending' | 'success' | 'failed'>> = {
      'orange_money': {
        'INITIATED': 'pending',
        'PENDING': 'pending',
        'SUCCESSFUL': 'success',
        'FAILED': 'failed'
      },
      'wave': {
        'PENDING': 'pending',
        'SUCCESS': 'success',
        'FAILED': 'failed'
      },
      'mtn': {
        'PENDING': 'pending',
        'SUCCESSFUL': 'success',
        'FAILED': 'failed'
      },
      'other': {
        'PENDING': 'pending',
        'SUCCESS': 'success',
        'FAILED': 'failed'
      }
    };

    return statusMaps[method][providerStatus] || 'failed';
  }

  private formatPhoneNumber(phoneNumber: string, provider: string): string {
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