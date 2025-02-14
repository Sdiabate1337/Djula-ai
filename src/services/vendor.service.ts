import { Vendor, VendorSession } from '../types/';
import { join } from 'path';
import * as fs from 'fs';

export class VendorService {
  private vendors: Map<string, Vendor> = new Map();
  private sessions: Map<string, VendorSession> = new Map();
  private readonly BASE_AUTH_PATH = join(process.cwd(), 'vendors_auth');

  constructor() {
    // Créer le dossier de base pour l'authentification des vendeurs
    if (!fs.existsSync(this.BASE_AUTH_PATH)) {
      fs.mkdirSync(this.BASE_AUTH_PATH, { recursive: true });
    }
  }

  public registerVendor(login: string, name: string, phoneNumber: string): Vendor {
    const currentTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const vendor: Vendor = {
      id: `V${Date.now()}`,
      login,
      name,
      phoneNumber,
      createdAt: currentTime,
      status: 'inactive',
      lastConnection: currentTime
    };

    this.vendors.set(vendor.id, vendor);
    return vendor;
  }

  public createSession(vendorId: string): VendorSession {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) throw new Error('Vendor not found');

    const currentTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const session: VendorSession = {
      vendorId,
      deviceId: `D${Date.now()}`,
      startTime: currentTime,
      isActive: true,
      authFolder: join(this.BASE_AUTH_PATH, vendorId)
    };

    // Créer un dossier d'authentification unique pour ce vendeur
    if (!fs.existsSync(session.authFolder)) {
      fs.mkdirSync(session.authFolder, { recursive: true });
    }

    this.sessions.set(vendorId, session);
    return session;
  }

  public getVendor(vendorId: string): Vendor | undefined {
    return this.vendors.get(vendorId);
  }

  public getSession(vendorId: string): VendorSession | undefined {
    return this.sessions.get(vendorId);
  }

  public updateVendorStatus(vendorId: string, status: 'active' | 'inactive'): void {
    const vendor = this.vendors.get(vendorId);
    if (vendor) {
      vendor.status = status;
      vendor.lastConnection = new Date().toISOString().replace('T', ' ').substr(0, 19);
      this.vendors.set(vendorId, vendor);
    }
  }
}