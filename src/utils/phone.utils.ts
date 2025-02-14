import { CountryCode, PhonePatterns, Country } from '../types/whatsapp.types';

export class PhoneNumberUtil {
  private static readonly PHONE_PATTERNS: PhonePatterns = {
    [Country.MOROCCO]: /^(?:\+212|0)([567]\d{8})$/,
    [Country.SENEGAL]: /^(?:\+221|0)(7[0-9]\d{7})$/,
    [Country.MALI]: /^(?:\+223|0)((?:2|5|6|7)\d{7})$/,
    [Country.IVORY_COAST]: /^(?:\+225|0)((?:0[1-9]|4[0-9]|5[0-9]|6[0-9])\d{7})$/,
    [Country.BURKINA]: /^(?:\+226|0)((?:5|6|7)\d{7})$/,
    [Country.NIGER]: /^(?:\+227|0)((?:9|8)\d{7})$/,
    [Country.TOGO]: /^(?:\+228|0)((?:9|7)\d{7})$/,
    [Country.BENIN]: /^(?:\+229|0)((?:9|6)\d{7})$/,
    [Country.GUINEA]: /^(?:\+224|0)((?:6|7)\d{7})$/,
    [Country.NIGERIA]: /^(?:\+234|0)((?:7|8|9)\d{9})$/,
    [Country.GHANA]: /^(?:\+233|0)((?:2|5)\d{8})$/,
  };

  static formatPhoneNumber(number: string): string {
    // Supprimer tous les espaces et caractères spéciaux
    let cleaned = number.replace(/[\s-.()+]/g, '');

    // Détecter le code pays
    let countryCode = this.detectCountryCode(cleaned);
    if (!countryCode) {
      // Si pas de code pays détecté, utiliser le code par défaut
      countryCode = Country.SENEGAL;
      // Si le numéro commence par 0, le supprimer
      cleaned = cleaned.replace(/^0/, '');
    } else {
      // Supprimer le code pays du numéro
      cleaned = cleaned.replace(new RegExp(`^\\+?${countryCode}`), '');
      // Supprimer le 0 initial si présent
      cleaned = cleaned.replace(/^0/, '');
    }

    // Vérifier la validité du numéro
    const pattern = this.PHONE_PATTERNS[countryCode];
    if (!pattern.test(`+${countryCode}${cleaned}`)) {
      throw new Error(`Numéro de téléphone invalide pour le pays ${countryCode}`);
    }

    // Format WhatsApp
    return `${countryCode}${cleaned}@s.whatsapp.net`;
  }

  private static detectCountryCode(number: string): CountryCode | null {
    const countryCodes = Object.values(Country);

    // Si le numéro commence par +, extraire le code pays
    if (number.startsWith('+')) {
      for (const code of countryCodes) {
        if (number.startsWith(`+${code}`)) {
          return code as CountryCode;
        }
      }
    }

    // Si le numéro commence par un code pays sans +
    for (const code of countryCodes) {
      if (number.startsWith(code)) {
        return code as CountryCode;
      }
    }

    return null;
  }

  static isValidPhoneNumber(number: string): boolean {
    try {
      this.formatPhoneNumber(number);
      return true;
    } catch {
      return false;
    }
  }

  static getCountryName(countryCode: CountryCode): string {
    const countryNames: Record<CountryCode, string> = {
      '212': 'Maroc',
      '221': 'Sénégal',
      '223': 'Mali',
      '225': 'Côte d\'Ivoire',
      '226': 'Burkina Faso',
      '227': 'Niger',
      '228': 'Togo',
      '229': 'Bénin',
      '224': 'Guinée',
      '234': 'Nigeria',
      '233': 'Ghana'
    };

    return countryNames[countryCode] || 'Pays inconnu';
  }
}