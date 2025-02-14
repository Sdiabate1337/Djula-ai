import { Logger } from "pino";

// Définir d'abord le type pour les codes pays
export type CountryCode = 
  | '212' | '221' | '223' | '225' | '226' 
  | '227' | '228' | '229' | '224' | '234' | '233';

// Utiliser un type mappé au lieu d'une signature d'index
export type PhonePatterns = {
  [K in CountryCode]: RegExp;
};

export interface WhatsAppMessage {
    text: string;
    from: string;
    to: string;
    timestamp: number;
    isGroup: boolean;
    messageId: string;
    participant?: string;
  }
  
  export type MessageHandler = (message: WhatsAppMessage) => Promise<void>;
  
  
  export interface WhatsAppState {
    isConnected: boolean;
    qrCode?: string;
    lastError?: Error;
    userId: string;
    startTime: string;
    currentTime: string;
  }

// Ajouter une énumération pour les pays
export enum Country {
  MOROCCO = '212',
  SENEGAL = '221',
  MALI = '223',
  IVORY_COAST = '225',
  BURKINA = '226',
  NIGER = '227',
  TOGO = '228',
  BENIN = '229',
  GUINEA = '224',
  NIGERIA = '234',
  GHANA = '233'
}