import { whatsappService } from './src/services/whatsapp.service.js';

console.log('Starting WhatsApp Service Test...');
console.log('Please wait for the QR code to appear...');

// The constructor of WhatsAppService will automatically trigger initializeClient() 
// if WHATSAPP_ENABLE=true in the .env file.
// If it is false, it won't run, so we need to force it or tell the user.

setTimeout(() => {
    console.log('\nIf you do not see a QR code or connection success message, make sure WHATSAPP_ENABLE=true in your .env file.\n');
}, 5000);

// Keep the process alive so the user can scan the QR code
setInterval(() => {}, 1000 * 60 * 60); 
