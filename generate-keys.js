import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048, // Key size (2048 is recommended)
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Create .env.local file if it doesn't exist
const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, '');
}

// Function to update or add environment variable in .env file
const updateEnvFile = (filePath, key, value) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  
  if (regex.test(content)) {
    // Replace existing value
    content = content.replace(regex, `${key}=${value}`);
  } else {
    // Add new key-value pair
    content += `\n${key}=${value}`;
  }
  
  fs.writeFileSync(filePath, content.trim() + '\n');
};

// Store keys in .env.local
updateEnvFile(envPath, 'RSA_PUBLIC_KEY', publicKey);
updateEnvFile(envPath, 'RSA_PRIVATE_KEY', privateKey);

console.log('RSA keys generated and stored in .env.local');