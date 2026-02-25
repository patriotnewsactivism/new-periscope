const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Function to generate RSA key pair
function generateRSAKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // 2048-bit modulus for security
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

// Function to save keys to .env.local file
function saveKeysToEnv(publicKey, privateKey) {
  const envPath = path.resolve('.env.local');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove existing key entries if they exist
  const filteredContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('NEXTAUTH_SECRET=') && !line.startsWith('NEXTAUTH_URL=') && !line.startsWith('PUBLIC_KEY=') && !line.startsWith('PRIVATE_KEY='))
    .filter(line => line.trim() !== '')
    .join('\n');

  // Add new keys
  const newKeys = `
PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"
PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"
`;

  const finalContent = filteredContent + newKeys + '\n';

  fs.writeFileSync(envPath, finalContent, 'utf8');
  console.log('Keys saved to .env.local');
}

// Main function
function main() {
  try {
    console.log('Generating RSA key pair...');
    const { publicKey, privateKey } = generateRSAKeys();
    console.log('Key generation successful');
    
    console.log('\nPublic Key:');
    console.log(publicKey);
    
    console.log('\nPrivate Key:');
    console.log(privateKey);
    
    console.log('\nSaving keys to .env.local...');
    saveKeysToEnv(publicKey, privateKey);
    
    console.log('\n✅ RSA key pair generated and saved successfully');
    console.log('\n⚠️  Important Security Note:');
    console.log('   - Never commit your private key to version control');
    console.log('   - Keep your .env.local file secure');
    console.log('   - 2048-bit keys provide strong security for most applications');
    
  } catch (error) {
    console.error('❌ Error generating keys:', error);
    process.exit(1);
  }
}

main();