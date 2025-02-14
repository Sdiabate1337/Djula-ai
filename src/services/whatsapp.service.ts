import makeWASocket, {
  DisconnectReason,
  WASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { PhoneNumberUtil } from '../utils/phone.utils';
import { WhatsAppMessage, MessageHandler, WhatsAppState } from '../types/whatsapp.types';
import { Vendor, VendorSession } from '../types/';
import { VendorService } from './vendor.service';
import * as fs from 'fs';
import { join } from 'path';
import pino from 'pino';
import type { Logger } from 'pino';

export class WhatsAppService {
  private clients: Map<string, WASocket> = new Map();
  private states: Map<string, WhatsAppState> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private retryCount: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_INTERVAL = 5000;
  private vendorService: VendorService;
  private readonly CURRENT_TIME = '2025-02-14 02:47:45';
  private readonly DEFAULT_USER = 'Sdiabate1337';

  constructor(vendorService: VendorService) {
    this.vendorService = vendorService;
  }

  private getCurrentTime(): string {
    return new Date().toISOString()
      .replace('T', ' ')
      .slice(0, 19);
  }

  private updateCurrentTime(vendorId: string): void {
    const state = this.states.get(vendorId);
    if (state) {
      state.currentTime = this.getCurrentTime();
      this.states.set(vendorId, state);
    }
  }

  public async initializeVendor(vendorId: string): Promise<void> {
    const vendor = this.vendorService.getVendor(vendorId);
    if (!vendor) throw new Error('Vendor not found');

    const session = this.vendorService.getSession(vendorId) || 
                   this.vendorService.createSession(vendorId);

    const state: WhatsAppState = {
      isConnected: false,
      userId: vendor.login || this.DEFAULT_USER,
      startTime: this.CURRENT_TIME,
      currentTime: this.CURRENT_TIME
    };

    this.states.set(vendorId, state);
    this.messageHandlers.set(vendorId, new Set());
    this.retryCount.set(vendorId, 0);
    await this.initializeClient(vendorId, session);
  }

  private async initializeClient(vendorId: string, session: VendorSession): Promise<void> {
    try {
      const { version } = await fetchLatestBaileysVersion();
      console.log(`[${this.CURRENT_TIME}] Initialisation WhatsApp pour ${vendorId}`);

      const { state, saveCreds } = await useMultiFileAuthState(session.authFolder);
      const logger: Logger = pino({ 
        level: 'silent',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true
          }
        }
      });

      const client = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true,
        logger
      });

      this.clients.set(vendorId, client);

      client.ev.on('connection.update', (update) => 
        this.handleConnectionUpdate(vendorId, update));
      client.ev.on('creds.update', saveCreds);
      client.ev.on('messages.upsert', (messages) => 
        this.handleIncomingMessages(vendorId, messages));

    } catch (error) {
      console.error(`[${this.CURRENT_TIME}] Erreur d'initialisation pour ${vendorId}:`, error);
      await this.handleInitializationError(vendorId);
    }
  }

  private async handleConnectionUpdate(
    vendorId: string, 
    update: { connection?: string, lastDisconnect?: { error?: Error }, qr?: string }
  ) {
    this.updateCurrentTime(vendorId);
    const state = this.states.get(vendorId);
    if (!state) return;

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.qrCode = qr;
      console.log(`[${state.currentTime}] Nouveau QR Code pour ${state.userId}`);
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      state.isConnected = false;
      this.states.set(vendorId, state);

      if (shouldReconnect) {
        const session = this.vendorService.getSession(vendorId);
        if (session) {
          setTimeout(() => this.initializeClient(vendorId, session), this.RETRY_INTERVAL);
        }
      } else if (statusCode === DisconnectReason.loggedOut) {
        await this.clearAuth(vendorId);
      }
    } else if (connection === 'open') {
      console.log(`[${state.currentTime}] ✓ ${state.userId} connecté`);
      state.isConnected = true;
      state.qrCode = undefined;
      this.retryCount.set(vendorId, 0);
      this.states.set(vendorId, state);
    }
  }

  private async handleInitializationError(vendorId: string) {
    this.updateCurrentTime(vendorId);
    const count = (this.retryCount.get(vendorId) || 0) + 1;
    this.retryCount.set(vendorId, count);

    if (count < this.MAX_RETRIES) {
      const session = this.vendorService.getSession(vendorId);
      if (session) {
        setTimeout(() => this.initializeClient(vendorId, session), this.RETRY_INTERVAL);
      }
    } else {
      const state = this.states.get(vendorId);
      if (state) {
        state.lastError = new Error('Maximum retry attempts reached');
        this.states.set(vendorId, state);
      }
      await this.clearAuth(vendorId);
    }
  }

  private async handleIncomingMessages(
    vendorId: string, 
    { messages, type }: { messages: proto.IWebMessageInfo[], type: string }
  ) {
    if (type !== 'notify') return;

    this.updateCurrentTime(vendorId);
    const state = this.states.get(vendorId);
    const handlers = this.messageHandlers.get(vendorId);
    if (!state || !handlers) return;

    for (const message of messages) {
      if (message.key.fromMe || !message.message) continue;

      const whatsappMessage: WhatsAppMessage = {
        text: message.message?.conversation || 
              message.message?.extendedTextMessage?.text || '',
        from: message.key.remoteJid || '',
        to: this.clients.get(vendorId)?.user?.id || '',
        timestamp: message.messageTimestamp as number || Date.now(),
        isGroup: message.key.remoteJid?.endsWith('@g.us') || false,
        messageId: message.key.id || '',
        participant: message.key.participant || undefined
      };

      for (const handler of handlers) {
        try {
          await handler(whatsappMessage);
        } catch (error) {
          console.error(`[${state.currentTime}] Erreur handler pour ${state.userId}:`, error);
        }
      }
    }
  }

  private async clearAuth(vendorId: string): Promise<void> {
    const session = this.vendorService.getSession(vendorId);
    if (!session) return;

    try {
      if (fs.existsSync(session.authFolder)) {
        fs.rmSync(session.authFolder, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`[${this.getCurrentTime()}] Erreur nettoyage auth pour ${vendorId}:`, error);
    }
  }

  public async sendMessage(vendorId: string, to: string, text: string): Promise<boolean> {
    this.updateCurrentTime(vendorId);
    const client = this.clients.get(vendorId);
    const state = this.states.get(vendorId);
    
    if (!client || !state?.isConnected) {
      throw new Error('Client non connecté');
    }

    try {
      const formattedNumber = PhoneNumberUtil.formatPhoneNumber(to);
      await client.sendMessage(formattedNumber, { text });
      console.log(`[${state.currentTime}] Message envoyé par ${state.userId} à ${formattedNumber}`);
      return true;
    } catch (error) {
      console.error(`[${state.currentTime}] Erreur d'envoi pour ${state.userId}:`, error);
      return false;
    }
  }

  public onMessage(vendorId: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(vendorId);
    if (handlers) {
      handlers.add(handler);
      this.messageHandlers.set(vendorId, handlers);
    }
  }

  public removeMessageHandler(vendorId: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(vendorId);
    if (handlers) {
      handlers.delete(handler);
      this.messageHandlers.set(vendorId, handlers);
    }
  }

  public getState(vendorId: string): WhatsAppState | undefined {
    this.updateCurrentTime(vendorId);
    return this.states.get(vendorId);
  }

  public async restart(vendorId: string): Promise<void> {
    this.updateCurrentTime(vendorId);
    await this.clearAuth(vendorId);
    this.retryCount.set(vendorId, 0);
    
    const session = this.vendorService.getSession(vendorId);
    if (session) {
      await this.initializeClient(vendorId, session);
    }
  }

  public async logout(vendorId: string): Promise<void> {
    this.updateCurrentTime(vendorId);
    const client = this.clients.get(vendorId);
    if (client) {
      await client.logout();
      await this.clearAuth(vendorId);
      
      const state = this.states.get(vendorId);
      if (state) {
        state.isConnected = false;
        this.states.set(vendorId, state);
      }
      
      this.clients.delete(vendorId);
    }
  }

  public async disconnectAll(): Promise<void> {
    for (const vendorId of this.clients.keys()) {
      await this.logout(vendorId);
    }
  }
}