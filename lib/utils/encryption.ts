import crypto from 'crypto';

// Encryption algorithm
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Get encryption key from environment variable
 * Derives a 32-byte key from ENCRYPTION_KEY or JWT_SECRET using SHA-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!key) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET environment variable must be set');
  }

  // Use SHA-256 to derive exactly 32 bytes from the secret
  // This allows using secrets of any length
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:encryptedData
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty text');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return IV and encrypted data separated by colon
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string
 * @param encryptedText - Encrypted text in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty text');
  }

  const key = getEncryptionKey();
  const parts = encryptedText.split(':');

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a random 32-character encryption key
 * Use this to generate your ENCRYPTION_KEY for .env.local
 * @returns 32-character random string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(16).toString('hex');
}
