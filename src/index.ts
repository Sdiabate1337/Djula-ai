import { WhatsAppService } from './services/whatsapp.service';
import { VendorService } from './services/vendor.service';
import { WhatsAppMessage } from './types/whatsapp.types';

async function main() {
  // Initialisation des services
  const vendorService = new VendorService();
  const whatsapp = new WhatsAppService(vendorService);

  // Création d'un vendeur par défaut
  const defaultVendor = vendorService.registerVendor(
    'Sdiabate1337',
    'Sidiki Diabaté',
    '+22375000000'
  );

  // Initialisation du service WhatsApp pour le vendeur
  await whatsapp.initializeVendor(defaultVendor.id);

  // Gérer les messages entrants pour ce vendeur
  whatsapp.onMessage(defaultVendor.id, async (message: WhatsAppMessage) => {
    if (!message.isGroup) {
      console.log(`[${getCurrentTime()}] Message reçu de ${message.from}: ${message.text}`);
      
      try {
        await whatsapp.sendMessage(defaultVendor.id, message.from, `Message reçu: ${message.text}`);
      } catch (error) {
        console.error(`[${getCurrentTime()}] Erreur lors de l'envoi de la réponse:`, error);
      }
    }
  });

  // Vérifier l'état périodiquement
  setInterval(() => {
    const state = whatsapp.getState(defaultVendor.id);
    if (state?.lastError) {
      console.error(`[${getCurrentTime()}] Erreur détectée:`, state.lastError.message);
    }
    console.log(`[${getCurrentTime()}] État de la connexion:`, state?.isConnected);
  }, 30000);

  // Gérer les erreurs non capturées
  process.on('uncaughtException', async (error) => {
    console.error(`[${getCurrentTime()}] Erreur non capturée:`, error);
    await whatsapp.restart(defaultVendor.id);
  });

  // Gérer l'arrêt propre
  process.on('SIGINT', async () => {
    console.log(`[${getCurrentTime()}] Arrêt du service...`);
    await whatsapp.disconnectAll();
    process.exit(0);
  });
}

// Fonction utilitaire pour le timestamp
function getCurrentTime(): string {
  return new Date().toISOString()
    .replace('T', ' ')
    .slice(0, 19);
}

// Démarrage de l'application
main().catch((error) => {
  console.error(`[${getCurrentTime()}] Erreur principale:`, error);
  process.exit(1);
});