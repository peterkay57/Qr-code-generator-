import { openDB, IDBPDatabase } from 'idb';
import { PasswordEntry, VaultMetadata } from '../types';

const DB_NAME = 'password_vault_db';
const DB_VERSION = 1;

class VaultService {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('vault_data')) {
          db.createObjectStore('vault_data', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('vault_metadata')) {
          db.createObjectStore('vault_metadata');
        }
      },
    });
  }

  // --- CRYPTO HELPERS ---

  private async deriveKey(masterPassword: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterPassword),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string, masterPassword: string, saltBase64: string, iterations: number): Promise<{ ciphertext: string; iv: string }> {
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const key = await this.deriveKey(masterPassword, salt, iterations);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  async decrypt(ciphertextBase64: string, ivBase64: string, masterPassword: string, saltBase64: string, iterations: number): Promise<string> {
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
    const key = await this.deriveKey(masterPassword, salt, iterations);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  // --- DATABASE HELPERS ---

  async getMetadata(): Promise<VaultMetadata | null> {
    const db = await this.db;
    return db.get('vault_metadata', 'main_meta');
  }

  async saveMetadata(meta: VaultMetadata): Promise<void> {
    const db = await this.db;
    await db.put('vault_metadata', meta, 'main_meta');
  }

  async saveEntry(entry: PasswordEntry): Promise<void> {
    const db = await this.db;
    await db.put('vault_data', entry);
  }

  async getAllEntries(): Promise<PasswordEntry[]> {
    const db = await this.db;
    return db.getAll('vault_data');
  }

  async deleteEntry(id: string): Promise<void> {
    const db = await this.db;
    await db.delete('vault_data', id);
  }
}

export const vaultService = new VaultService();
