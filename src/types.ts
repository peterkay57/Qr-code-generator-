export interface TOTPAccount {
  id: string;
  name: string;
  issuer?: string;
  secret: string;
  addedAt: number;
}

export interface PasswordEntry {
  id: string;
  service: string;
  username: string;
  password: string; // Encrypted (base64)
  iv: string;       // Initialization Vector (base64)
  url?: string;
  notes?: string;
  category: 'Work' | 'Personal' | 'Banking' | 'Social' | 'Other';
  createdAt: number;
  updatedAt: number;
}

export interface VaultMetadata {
  salt: string;        // Base64
  iterations: number;
  version: number;
}
