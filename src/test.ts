import { WhatsAppService } from './services/whatsapp.service';
import { VendorService } from './services/vendor.service';

const CURRENT_TIME = '2025-02-14 03:30:06';
const DEFAULT_USER = 'Sdiabate1337';
const TEST_PHONE = '212714460468';

async function runTest() {
  console.log(`[${CURRENT_TIME}] Démarrage du test pour ${DEFAULT_USER}`);
  
  const vendorService = new VendorService();
  const whatsapp = new WhatsAppService(vendorService);

  // Création du vendeur test avec seulement les 3 paramètres requis
  const testVendor = vendorService.registerVendor(
    DEFAULT_USER,
    'Sidiki Diabaté',
    TEST_PHONE
  );

  try {
    console.log(`[${CURRENT_TIME}] Initialisation du vendeur ${DEFAULT_USER}...`);
    await whatsapp.initializeVendor(testVendor.id);

    // Attente de la connexion
    console.log(`[${CURRENT_TIME}] En attente de connexion pour ${DEFAULT_USER}...`);
    let connected = false;
    const maxAttempts = 30;
    
    for (let i = 0; i < maxAttempts && !connected; i++) {
      const state = whatsapp.getState(testVendor.id);
      if (state?.isConnected) {
        connected = true;
        console.log(`[${CURRENT_TIME}] ✓ ${DEFAULT_USER} connecté`);
        break;
      }
      
      if (state?.qrCode) {
        console.log(`[${CURRENT_TIME}] Nouveau QR Code pour ${DEFAULT_USER}`);
        // Affichage du QR code
        console.log(state.qrCode);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }

    if (!connected) {
      throw new Error('Timeout: La connexion n\'a pas pu être établie après 30 secondes');
    }

    // Test d'envoi de message
    console.log(`[${CURRENT_TIME}] Tentative d'envoi de message test...`);
    const success = await whatsapp.sendMessage(
      testVendor.id,
      TEST_PHONE,
      'Test message from Djula.ai'
    );

    if (success) {
      console.log(`[${CURRENT_TIME}] Message envoyé par ${DEFAULT_USER} à ${TEST_PHONE}@s.whatsapp.net`);
      console.log(`[${CURRENT_TIME}] Message envoyé: true`);
    } else {
      throw new Error('Échec de l\'envoi du message');
    }

  } catch (error) {
    console.error(`[${CURRENT_TIME}] ❌ Erreur durant le test:`, error);
    throw error;
  } finally {
    // Nettoyage
    console.log(`[${CURRENT_TIME}] Déconnexion...`);
    await whatsapp.logout(testVendor.id);
  }
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error(`[${CURRENT_TIME}] Erreur non capturée:`, error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log(`[${CURRENT_TIME}] Arrêt forcé du test...`);
  process.exit(0);
});

// Exécution du test
console.log(`[${CURRENT_TIME}] === Début des tests WhatsApp ===`);
runTest()
  .then(() => {
    console.log(`[${CURRENT_TIME}] ✓ Tests terminés avec succès`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[${CURRENT_TIME}] ❌ Tests échoués:`, error);
    process.exit(1);
  });