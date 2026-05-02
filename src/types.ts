export interface TOTPAccount {
  id: string;
  name: string;
  issuer?: string;
  secret: string;
  addedAt: number;
}
