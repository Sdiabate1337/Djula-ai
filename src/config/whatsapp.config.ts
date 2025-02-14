import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Codes pays pour l'Afrique de l'Ouest et le Maroc
export const COUNTRY_CODES = {
  MOROCCO: '212',    // Maroc
  SENEGAL: '221',    // Sénégal
  MALI: '223',       // Mali
  IVORY_COAST: '225', // Côte d'Ivoire
  BURKINA: '226',    // Burkina Faso
  NIGER: '227',      // Niger
  TOGO: '228',       // Togo
  BENIN: '229',      // Bénin
  GUINEA: '224',     // Guinée
  NIGERIA: '234',    // Nigeria
  GHANA: '233',      // Ghana
} as const;

export const WHATSAPP_CONFIG = {
  // Configuration de base
  SESSION_NAME: process.env.WHATSAPP_SESSION_NAME || 'djula-bot',
  AUTH_DIR: join(process.cwd(), '.whatsapp_auth'),
  
  // Configuration régionale
  DEFAULT_COUNTRY_CODE: COUNTRY_CODES.SENEGAL, // Code pays par défaut
  SUPPORTED_COUNTRIES: COUNTRY_CODES,
  
  // Configuration des langues
  SUPPORTED_LANGUAGES: ['fr', 'en', 'ar'] as const,
  DEFAULT_LANGUAGE: 'fr' as const,
  
  // Configuration du client
  CLIENT_CONFIG: {
    browser: ['Djula AI', 'Chrome', '1.0.0'] as [string, string, string],
    syncFullHistory: true,
    markOnlineOnConnect: true,
    printQRInTerminal: true,
    locale: {
      language: 'fr',
    }
  },

  // Timeouts et intervalles
  CONNECTION_TIMEOUT: 60000,
  RECONNECT_INTERVAL: 5000
};